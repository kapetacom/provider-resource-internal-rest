import {useEffect, useReducer} from 'react';
import {useMappingHandler} from './useMappingHandler';
import {RESTKindContext, RESTMethodEdit, convertAllToEditMethods, isCompatibleRESTMethods} from '../types';
import {
    MappedMethod,
    MappingHandlerContext,
    MappingHandlerData,
    RESTMethodMappingEdit,
    createEqualMapping,
    createSourceOnlyMapping,
    createTargetOnlyMapping,
} from './types';
import {cloneDeep, isEmpty} from 'lodash';
import {ConnectionMethodMappingType, ConnectionMethodsMapping} from '@kapeta/ui-web-types';
import {
    determineEntityIssues,
    getCompatibleMethodsAndEntities,
    getEntitiesToBeAddedForCopy,
    mappedMethodSorter,
} from './MappingUtils';
import {setRESTMethod} from '../RESTUtils';

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
    | {type: 'initializeContext'}
    | {type: 'convertToEditMethods'}
    | {type: 'handleTargetMethods'}
    | {type: 'handleSourceMethods'}
    | {type: 'copyCompatibleMethodsAndEntities'}
    | {type: 'readAndValidateMappingFromValue'; payload: {value?: ConnectionMethodsMapping}}
    | {type: 'sortMappedMethods'};

const isValueValid = (value?: ConnectionMethodsMapping): value is ConnectionMethodsMapping => {
    return Boolean(value && !isEmpty(value));
};

function reducer(state: MappingBuilderState, action: ActionType): MappingBuilderState {
    switch (action.type) {
        case 'initializeContext': {
            const handlerContextClone = cloneDeep(state.handlerContext);
            handlerContextClone.sourceName = state.sourceContext.resource.metadata.name;
            handlerContextClone.targetName = state.targetContext.resource.metadata.name;
            handlerContextClone.issues = determineEntityIssues(state.sourceContext, state.targetContext);
            return {
                ...state,
                handlerContext: handlerContextClone,
                didAutoMap: false,
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
            state.targetMethods.forEach((targetMethod) => {
                if (state.mappedTargets.indexOf(targetMethod) > -1) {
                    return;
                }
                unmappedTargetMethods.push(createTargetOnlyMapping(targetMethod));
            });

            return {
                ...state,
                mappedMethods: [...state.mappedMethods, ...unmappedTargetMethods],
            };
        }

        case 'handleSourceMethods': {
            const mappedSourcesClone = cloneDeep(state.mappedSources);
            const mappedTargetsClone = cloneDeep(state.mappedTargets);
            const targetContextClone = cloneDeep(state.targetContext);
            const mappedMethodsClone = cloneDeep(state.mappedMethods);

            state.sourceMethods.forEach((sourceMethod) => {
                if (state.mappedSources.indexOf(sourceMethod) > -1) {
                    return;
                }

                mappedSourcesClone.push(sourceMethod);

                if (!isValueValid(state.value)) {
                    // If there is no valid value, we try to auto-map as much as possible
                    for (let i = 0; i < state.targetMethods.length; i++) {
                        const targetMethod = state.targetMethods[i];

                        if (state.mappedTargets.indexOf(targetMethod) > -1) {
                            continue;
                        }

                        const {issues, entitiesToBeAdded} = getEntitiesToBeAddedForCopy(
                            {method: sourceMethod, entities: state.sourceContext.entities},
                            {method: targetMethod, entities: state.targetContext.entities}
                        );

                        if (issues.length === 0) {
                            mappedTargetsClone.push(targetMethod);
                            targetContextClone.entities.push(...entitiesToBeAdded);
                            mappedMethodsClone.push(createEqualMapping(sourceMethod, targetMethod));
                            return;
                        }
                    }
                }

                // No matching target found
                mappedMethodsClone.push(createSourceOnlyMapping(sourceMethod));
            });

            return {
                ...state,
                mappedSources: mappedSourcesClone,
                mappedTargets: mappedTargetsClone,
                targetContext: targetContextClone,
                mappedMethods: mappedMethodsClone,
            };
        }

        case 'copyCompatibleMethodsAndEntities': {
            const handlerContextClone = cloneDeep(state.handlerContext);
            const sourceMethodsClone = cloneDeep(state.sourceMethods);
            const sourceContextClone = cloneDeep(state.sourceContext);
            const targetMethodsClone = cloneDeep(state.targetMethods);
            const targetContextClone = cloneDeep(state.targetContext);

            // If target or source methods are empty we assume it is a new connection and mapping - and copy everything
            if (state.targetMethods.length === 0) {
                const {compatibleMethods, compatibleEntities} = getCompatibleMethodsAndEntities(
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
                }

                handlerContextClone.targetName = handlerContextClone.sourceName;
                handlerContextClone.clientWasEmpty = true;
            } else if (sourceMethodsClone.length === 0) {
                const {compatibleMethods, compatibleEntities} = getCompatibleMethodsAndEntities(
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
                }

                handlerContextClone.sourceName = handlerContextClone.targetName;
                handlerContextClone.serverWasEmpty = true;
            }

            return {
                ...state,
                handlerContext: handlerContextClone,
                sourceMethods: sourceMethodsClone,
                sourceContext: sourceContextClone,
                targetContext: targetContextClone,
                targetMethods: targetMethodsClone,
                didAutoMap: true,
            };
        }

        case 'readAndValidateMappingFromValue': {
            const {value} = action.payload;
            const handlerContextClone = cloneDeep(state.handlerContext);
            const mappedSourcesClone = cloneDeep(state.mappedSources);
            const mappedTargetsClone = cloneDeep(state.mappedTargets);
            const mappedMethodsClone = cloneDeep(state.mappedMethods);

            if (isValueValid(value)) {
                Object.entries(value).forEach(([sourceMethodId, mapping]) => {
                    const sourceMethod = state.sourceMethods.find((m) => m.id === sourceMethodId);

                    if (!sourceMethod) {
                        handlerContextClone.warnings.push(
                            `Mapped method ${sourceMethodId} did not exist and was removed.`
                        );
                        return;
                    }

                    const targetMethod = state.targetMethods.find((m) => m.id === mapping.targetId);
                    if (!targetMethod) {
                        handlerContextClone.warnings.push(
                            `Mapped method ${mapping.targetId} did not exist and was removed.`
                        );
                        return;
                    }

                    mappedTargetsClone.push(targetMethod);
                    mappedSourcesClone.push(sourceMethod);

                    const isCompatible = isCompatibleRESTMethods(
                        {method: sourceMethod, entities: state.sourceContext.entities},
                        {method: targetMethod, entities: state.targetContext.entities}
                    );

                    if (!isCompatible) {
                        // Something changed and methods are no longer compatible
                        handlerContextClone.warnings.push(
                            `Mapping for ${handlerContextClone.sourceName}.${sourceMethodId} and ${handlerContextClone.targetName}.${mapping.targetId} was invalid and was removed.`
                        );

                        mappedMethodsClone.push(
                            createSourceOnlyMapping(sourceMethod),
                            createTargetOnlyMapping(targetMethod)
                        );
                        return;
                    }

                    switch (mapping.type) {
                        case ConnectionMethodMappingType.EXACT: // Only exact mapping supported right now
                            mappedMethodsClone.push(createEqualMapping(sourceMethod, targetMethod));
                            break;
                    }
                });
            }

            return {
                ...state,
                value,
                handlerContext: handlerContextClone,
                mappedSources: mappedSourcesClone,
                mappedTargets: mappedTargetsClone,
                mappedMethods: mappedMethodsClone,
            };
        }

        case 'sortMappedMethods': {
            return {
                ...state,
                mappedMethods: state.mappedMethods.sort(mappedMethodSorter),
            };
        }

        default: {
            return {...state};
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
        dispatch({type: 'initializeContext'});
        dispatch({type: 'convertToEditMethods'});
        if (isValueValid(value)) {
            dispatch({type: 'readAndValidateMappingFromValue', payload: {value}});
        } else {
            dispatch({type: 'copyCompatibleMethodsAndEntities'});
        }
        dispatch({type: 'handleSourceMethods'});
        dispatch({type: 'handleTargetMethods'});
        dispatch({type: 'sortMappedMethods'});
    };

    const mappingHandler = useMappingHandler(
        state.mappedMethods,
        state.sourceContext,
        state.targetContext,
        state.didAutoMap,
        onDataChanged
    );

    // Initialize on mount and when `value` changes
    useEffect(() => {
        init(value);
    }, [value]);

    return {
        mappingHandler,
        ...state.handlerContext,
    };
};
