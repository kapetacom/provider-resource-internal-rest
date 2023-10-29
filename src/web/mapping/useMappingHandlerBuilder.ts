/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useReducer } from 'react';
import { useMappingHandler } from './useMappingHandler';
import { RESTKindContext, RESTMethodEdit, convertAllToEditMethods, isCompatibleRESTMethods } from '../types';
import {
    MappedMethod,
    MappingHandlerContext,
    MappingHandlerData,
    RESTMethodMappingEdit,
    createEqualMapping,
    createSourceOnlyMapping,
    createTargetOnlyMapping,
} from './types';
import { cloneDeep, isEmpty } from 'lodash';
import { ConnectionMethodMappingType, ConnectionMethodsMapping } from '@kapeta/ui-web-types';
import {
    determineEntityIssues,
    getCompatibleMethodsAndEntities,
    getEntitiesToBeAddedForCopy,
    mappedMethodSorter,
} from './MappingUtils';
import { setRESTMethod } from '../RESTUtils';

type MappingBuilderState = {
    sourceContext: RESTKindContext;
    sourceMethods: RESTMethodEdit[];
    mappedSources: RESTMethodEdit[];
    targetContext: RESTKindContext;
    targetMethods: RESTMethodMappingEdit[];
    mappedTargets: RESTMethodEdit[];
    mappedMethods: MappedMethod[];
    handlerContext: MappingHandlerContext;
    didAutoMap: boolean;
    value?: ConnectionMethodsMapping;
};

type ActionType =
    | { type: 'initializeContext' }
    | { type: 'convertToEditMethods' }
    | { type: 'handleTargetMethods' }
    | { type: 'handleSourceMethods' }
    | { type: 'copyCompatibleMethodsAndEntities' }
    | { type: 'readAndValidateMappingFromValue'; payload: { value: ConnectionMethodsMapping } }
    | { type: 'sortMappedMethods' };

const isValueValid = (value?: ConnectionMethodsMapping): value is ConnectionMethodsMapping => {
    return Boolean(value && !isEmpty(value));
};

const compareToMethod = (sourceMethod: RESTMethodEdit) => (mS: RESTMethodEdit) => mS.id === sourceMethod.id;

function reducer(state: MappingBuilderState, action: ActionType): MappingBuilderState {
    switch (action.type) {
        case 'initializeContext': {
            const handlerContextClone = cloneDeep(state.handlerContext);
            handlerContextClone.sourceName = state.sourceContext.resource.metadata.name;
            handlerContextClone.targetName = state.targetContext.resource.metadata.name;
            handlerContextClone.issues = determineEntityIssues(state.sourceContext, state.targetContext);
            return {
                value: state.value,
                sourceContext: state.sourceContext,
                sourceMethods: state.sourceMethods,
                targetContext: state.targetContext,
                targetMethods: state.targetMethods,
                handlerContext: handlerContextClone,
                didAutoMap: false,
                mappedSources: [],
                mappedMethods: [],
                mappedTargets: [],
            };
        }

        case 'convertToEditMethods': {
            return {
                ...state,
                sourceMethods: convertAllToEditMethods(state.sourceContext.resource),
                targetMethods: convertAllToEditMethods(state.targetContext.resource),
            };
        }

        case 'handleTargetMethods': {
            const unmappedTargetMethods: MappedMethod[] = [];
            let didAutoMap = state.didAutoMap;
            state.targetMethods.forEach((targetMethod) => {
                if (state.mappedTargets.some(compareToMethod(targetMethod))) {
                    return;
                }
                didAutoMap = true;
                unmappedTargetMethods.push(createTargetOnlyMapping(targetMethod));
            });

            return {
                ...state,
                mappedMethods: [...state.mappedMethods, ...unmappedTargetMethods],
                didAutoMap,
            };
        }

        case 'handleSourceMethods': {
            const mappedSourcesClone = cloneDeep(state.mappedSources);
            const mappedTargetsClone = cloneDeep(state.mappedTargets);
            const targetContextClone = cloneDeep(state.targetContext);
            const mappedMethodsClone = cloneDeep(state.mappedMethods);

            let didAutoMap = state.didAutoMap;

            state.sourceMethods.forEach((sourceMethod) => {
                if (state.mappedSources.some(compareToMethod(sourceMethod))) {
                    return;
                }

                mappedSourcesClone.push(sourceMethod);

                if (!isValueValid(state.value)) {
                    // If there is no valid value, we try to auto-map as much as possible
                    for (let i = 0; i < state.targetMethods.length; i++) {
                        const targetMethod = state.targetMethods[i];

                        if (state.mappedTargets.some(compareToMethod(targetMethod))) {
                            continue;
                        }

                        const { issues, entitiesToBeAdded } = getEntitiesToBeAddedForCopy(
                            { method: sourceMethod, entities: state.sourceContext.entities },
                            { method: targetMethod, entities: state.targetContext.entities }
                        );

                        if (issues.length === 0) {
                            mappedTargetsClone.push(targetMethod);
                            targetContextClone.entities.push(...entitiesToBeAdded);
                            mappedMethodsClone.push(createEqualMapping(sourceMethod, targetMethod));
                            didAutoMap = true;
                            return;
                        }
                    }
                }

                // No matching target found
                mappedMethodsClone.push(createSourceOnlyMapping(sourceMethod));
                didAutoMap = true;
            });

            return {
                ...state,
                mappedSources: mappedSourcesClone,
                mappedTargets: mappedTargetsClone,
                targetContext: targetContextClone,
                mappedMethods: mappedMethodsClone,
                didAutoMap,
            };
        }

        case 'copyCompatibleMethodsAndEntities': {
            const handlerContextClone = cloneDeep(state.handlerContext);
            const sourceMethodsClone = cloneDeep(state.sourceMethods);
            const sourceContextClone = cloneDeep(state.sourceContext);
            const targetMethodsClone = cloneDeep(state.targetMethods);
            const targetContextClone = cloneDeep(state.targetContext);

            let anyChanged = false;

            // If target or source methods are empty we assume it is a new connection and mapping - and copy everything
            if (state.targetMethods.length === 0) {
                const { compatibleMethods, compatibleEntities } = getCompatibleMethodsAndEntities(
                    state.sourceMethods,
                    state.sourceContext,
                    state.targetContext
                );

                if (compatibleMethods.length > 0) {
                    targetContextClone.entities.push(...compatibleEntities);
                    targetMethodsClone.push(...compatibleMethods);
                    compatibleMethods.forEach((method) => {
                        setRESTMethod(targetContextClone.resource.spec, method.id, method);
                    });
                    handlerContextClone.targetName = handlerContextClone.sourceName;
                    handlerContextClone.clientWasEmpty = true;
                    anyChanged = true;
                }
            } else if (state.sourceMethods.length === 0) {
                const { compatibleMethods, compatibleEntities } = getCompatibleMethodsAndEntities(
                    state.targetMethods,
                    state.targetContext,
                    state.sourceContext
                );

                if (compatibleMethods.length > 0) {
                    sourceContextClone.entities.push(...compatibleEntities);
                    sourceMethodsClone.push(...compatibleMethods);
                    // Also add to the spec
                    compatibleMethods.forEach((method) => {
                        setRESTMethod(sourceContextClone.resource.spec, method.id, method);
                    });
                    handlerContextClone.sourceName = handlerContextClone.targetName;
                    handlerContextClone.serverWasEmpty = true;
                    anyChanged = true;
                }
            }

            if (!anyChanged) {
                // No reason the mutate the state
                return { ...state };
            }

            return {
                handlerContext: handlerContextClone,
                sourceMethods: sourceMethodsClone,
                sourceContext: sourceContextClone,
                targetContext: targetContextClone,
                targetMethods: targetMethodsClone,
                didAutoMap: true,
                mappedTargets: [],
                mappedSources: [],
                mappedMethods: [],
            };
        }

        case 'readAndValidateMappingFromValue': {
            const { value } = action.payload;

            const handlerContextClone: MappingHandlerContext = {
                issues: [],
                warnings: [],
                clientWasEmpty: false,
                serverWasEmpty: false,
                sourceName: state.sourceContext.resource.metadata.name,
                targetName: state.targetContext.resource.metadata.name,
            };
            const mappedSources: RESTMethodEdit[] = [];
            const mappedTargets: RESTMethodEdit[] = [];
            const mappedMethods: MappedMethod[] = [];

            Object.entries(value).forEach(([sourceMethodId, mapping]) => {
                const sourceMethod = state.sourceMethods.find((m) => m.id === sourceMethodId);

                if (!sourceMethod) {
                    handlerContextClone.warnings.push(`Mapped method ${sourceMethodId} did not exist and was removed.`);
                    return;
                }

                const targetMethod = state.targetMethods.find((m) => m.id === mapping.targetId);
                if (!targetMethod) {
                    handlerContextClone.warnings.push(
                        `Mapped method ${mapping.targetId} did not exist and was removed.`
                    );
                    return;
                }

                mappedTargets.push(targetMethod);
                mappedSources.push(sourceMethod);

                const isCompatible = isCompatibleRESTMethods(
                    { method: sourceMethod, entities: state.sourceContext.entities },
                    { method: targetMethod, entities: state.targetContext.entities }
                );

                if (!isCompatible) {
                    // Something changed and methods are no longer compatible
                    handlerContextClone.warnings.push(
                        `Mapping for ${handlerContextClone.sourceName}.${sourceMethodId} and ${handlerContextClone.targetName}.${mapping.targetId} was invalid and was removed.`
                    );

                    mappedMethods.push(createSourceOnlyMapping(sourceMethod), createTargetOnlyMapping(targetMethod));
                    return;
                }

                switch (mapping.type) {
                    case ConnectionMethodMappingType.EXACT: // Only exact mapping supported right now
                        mappedMethods.push(createEqualMapping(sourceMethod, targetMethod));
                        break;
                }
            });

            return {
                ...state,
                value,
                handlerContext: handlerContextClone,
                mappedSources: mappedSources,
                mappedTargets: mappedTargets,
                mappedMethods: mappedMethods,
            };
        }

        case 'sortMappedMethods': {
            return {
                ...state,
                mappedMethods: state.mappedMethods.sort(mappedMethodSorter),
            };
        }

        default: {
            return { ...state };
        }
    }
}

export const useMappingHandlerBuilder = (
    initialSourceContext: RESTKindContext,
    initialTargetContext: RESTKindContext,
    value?: ConnectionMethodsMapping,
    onDataChanged?: (data: MappingHandlerData) => void
) => {
    const [state, dispatch] = useReducer(reducer, {
        sourceContext: initialSourceContext,
        sourceMethods: [],
        mappedSources: [],
        targetContext: initialTargetContext,
        targetMethods: [],
        mappedTargets: [],
        mappedMethods: [],
        handlerContext: {
            clientWasEmpty: false,
            serverWasEmpty: false,
            sourceName: '',
            targetName: '',
            issues: [],
            warnings: [],
        },
        value,
        didAutoMap: false,
    });

    const init = (value?: ConnectionMethodsMapping) => {
        dispatch({ type: 'initializeContext' });
        dispatch({ type: 'convertToEditMethods' });
        dispatch({ type: 'copyCompatibleMethodsAndEntities' });

        if (isValueValid(value)) {
            dispatch({ type: 'readAndValidateMappingFromValue', payload: { value } });
        }
        dispatch({ type: 'handleSourceMethods' });
        dispatch({ type: 'handleTargetMethods' });
        dispatch({ type: 'sortMappedMethods' });
    };

    const mappingHandler = useMappingHandler(
        state.mappedMethods,
        state.sourceContext,
        state.targetContext,
        state.didAutoMap,
        onDataChanged
    );

    // Initialize on mount
    useEffect(() => {
        init(value);
    }, []);

    return {
        mappingHandler,
        ...state.handlerContext,
    };
};
