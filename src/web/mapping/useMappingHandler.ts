/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { useCallback, useEffect, useState } from 'react';
import { cloneDeep, find, pull } from 'lodash';
import { ToastType, showToasty } from '@kapeta/ui-web-components';
import { ConnectionMethodMappingType, ConnectionMethodsMapping } from '@kapeta/ui-web-types';
import { RESTKindContext, getCompatibleRESTMethodsIssues } from '../types';
import {
    MappedMethod,
    MappingHandlerData,
    createEqualMapping,
    createSourceOnlyMapping,
    toId,
    DSLControllerMethod,
} from './types';
import { getEntitiesToBeAddedForCopy } from './MappingUtils';
import { RESTResourceEditor } from '../RESTUtils';

const toMappingData = (methods: MappedMethod[]): ConnectionMethodsMapping => {
    const map: ConnectionMethodsMapping = {};
    methods.forEach((method) => {
        if (!method.source || !method.target || !method.mapped) {
            return;
        }

        map[toId(method.source)] = {
            targetId: toId(method.target),
            type: ConnectionMethodMappingType.EXACT, // We only support exact at the moment
        };
    });

    return map;
};
const toResultData = (
    source: RESTKindContext,
    target: RESTKindContext,
    methods: MappedMethod[]
): MappingHandlerData => {
    return {
        source: source.resource,
        sourceEntities: source.entities,
        target: target.resource,
        targetEntities: target.entities,
        data: toMappingData(methods),
    };
};
const canAddToTarget = (methods: MappedMethod[], ix: number): boolean => {
    const source = methods[ix].source;
    if (!source) {
        return false;
    }

    return !methods.some((method) => {
        if (method.source === source) {
            return false;
        }

        return method.target && toId(method.target) === toId(source);
    });
};
const canDropOnTarget = (methods: MappedMethod[], ix: number): boolean => !!methods[ix].target;
const isValid = (methods: MappedMethod[]): boolean => {
    for (let i = 0; i < methods.length; i++) {
        const method = methods[i];
        if (method.target && !method.mapped) {
            // All targets must be mapped to be valid
            return false;
        }
    }

    return methods.length > 0;
};

export const useMappingHandler = (
    initialMethods: MappedMethod[],
    initialSource: RESTKindContext,
    initialTarget: RESTKindContext,
    didAutoMap: boolean,
    onDataChanged?: (data: MappingHandlerData) => void
) => {
    const [state, setState] = useState({
        methods: initialMethods,
        source: initialSource,
        target: initialTarget,
    });

    // Update state when props change
    useEffect(() => {
        setState((stateX) => ({ ...stateX, methods: initialMethods }));
    }, [initialMethods]);
    useEffect(() => {
        setState((stateX) => ({ ...stateX, source: initialSource }));
    }, [initialSource]);
    useEffect(() => {
        setState((stateX) => ({ ...stateX, target: initialTarget }));
    }, [initialTarget]);

    const onStateChange = (source: RESTKindContext, target: RESTKindContext, methods: MappedMethod[]): void => {
        onDataChanged && onDataChanged(toResultData(source, target, methods));
    };

    const addToTarget = useCallback(
        (ix: number): void => {
            setState((prevState) => {
                const { target, methods, source } = prevState;
                const targetClone = cloneDeep(target);
                const methodsClone = cloneDeep(methods);

                const currentSource = methods[ix].source;
                if (!currentSource) {
                    return prevState;
                }

                const newTarget = { ...currentSource, copyOf: currentSource };

                const { issues, entitiesToBeAdded } = getEntitiesToBeAddedForCopy(
                    { method: currentSource, entities: source.entities },
                    { method: newTarget, entities: target.entities }
                );

                if (issues.length > 0) {
                    showToasty({
                        title: 'Could not add method',
                        type: ToastType.ALERT,
                        message: issues[0],
                    });
                    return prevState;
                }

                target.entities.push(...entitiesToBeAdded);

                new RESTResourceEditor(targetClone.resource).setMethod(toId(currentSource), newTarget);

                // Then add mapping for it
                methodsClone.splice(ix, 1, createEqualMapping(currentSource, newTarget));

                onStateChange(source, targetClone, methodsClone);
                return {
                    ...prevState,
                    target: targetClone,
                    methods: methodsClone,
                };
            });
        },
        [setState, onStateChange]
    );

    const addToSource = useCallback(
        (ix: number): void => {
            setState((prevState) => {
                const { source, methods, target } = prevState;
                const sourceClone = cloneDeep(source);
                const methodsClone = cloneDeep(methods);

                const currentTarget = methodsClone[ix].target;
                if (!currentTarget) {
                    return prevState;
                }

                const newSource = { ...currentTarget, copyOf: currentTarget };

                const { issues, entitiesToBeAdded } = getEntitiesToBeAddedForCopy(
                    { method: currentTarget, entities: target.entities },
                    { method: newSource, entities: source.entities }
                );

                if (issues.length > 0) {
                    showToasty({
                        title: 'Could not add method',
                        type: ToastType.ALERT,
                        message: issues[0],
                    });
                    return prevState;
                }

                sourceClone.entities.push(...entitiesToBeAdded);

                new RESTResourceEditor(sourceClone.resource).setMethod(toId(currentTarget), newSource);

                // Then add mapping for it
                methodsClone.splice(ix, 1, createEqualMapping(newSource, currentTarget));

                onStateChange(sourceClone, target, methodsClone);
                return {
                    ...prevState,
                    source: sourceClone,
                    methods: methodsClone,
                };
            });
        },
        [setState, onStateChange]
    );

    const removeTarget = useCallback(
        (ix: number): void => {
            setState((prevState) => {
                const { target, methods, source } = prevState;
                const targetClone = cloneDeep(target);
                const methodsClone = cloneDeep(methods);

                const currentTarget = methodsClone[ix].target;
                if (!currentTarget) {
                    return prevState;
                }

                // First remove the method from the target block
                new RESTResourceEditor(targetClone.resource).deleteMethod(toId(currentTarget));

                // Then remove mapping for it
                const sourceMethod = methodsClone[ix].source;
                if (sourceMethod) {
                    methodsClone.splice(ix, 1, createSourceOnlyMapping(sourceMethod));
                } else {
                    methodsClone.splice(ix, 1);
                }

                onStateChange(source, targetClone, methodsClone);

                return {
                    ...prevState,
                    target: targetClone,
                    methods: methodsClone,
                };
            });
        },
        [setState, onStateChange]
    );

    const removeSource = useCallback(
        (ix: number): void => {
            setState((prevState) => {
                const { source, methods, target } = prevState;
                const methodsClone = cloneDeep(methods);
                const sourceClone = cloneDeep(source);
                const currentMethod = methodsClone[ix];
                const currentSource = currentMethod.source;
                if (!currentSource) {
                    return prevState;
                }

                if (!currentSource.copyOf) {
                    // If source is not a copy from target
                    methodsClone.push(createSourceOnlyMapping(currentSource));
                }

                if (currentMethod.target && currentMethod.target.copyOf) {
                    // If the target is a copy
                    // First remove the method from the source resource
                    new RESTResourceEditor(sourceClone.resource).deleteMethod(toId(currentSource));
                    // And remove the entire line
                    pull(methodsClone, currentMethod);
                } else {
                    methodsClone[ix].source = undefined;
                    methodsClone[ix].sourceId = undefined;
                    methodsClone[ix].mapped = false;
                }
                onStateChange(sourceClone, target, methodsClone);

                return {
                    ...prevState,
                    source: sourceClone,
                    methods: methodsClone,
                };
            });
        },
        [setState, onStateChange]
    );

    const addMappingForTarget = useCallback(
        (ix: number, sourceMethod: DSLControllerMethod) => {
            setState((prevState) => {
                const { methods, source, target } = prevState;
                const methodsClone = cloneDeep(methods);

                const currentTarget = methodsClone[ix].target;
                if (!currentTarget) {
                    return prevState;
                }

                const errors = getCompatibleRESTMethodsIssues(
                    { method: currentTarget, entities: target.entities },
                    { method: sourceMethod, entities: source.entities }
                );

                if (errors.length > 0) {
                    showToasty({
                        title: 'Methods did not match',
                        type: ToastType.ALERT,
                        message: errors[0],
                    });
                    return prevState;
                }

                methodsClone[ix].source = sourceMethod;
                methodsClone[ix].sourceId = toId(sourceMethod);
                methodsClone[ix].mapped = true;

                const existing = find(methodsClone, { source: sourceMethod, mapped: false });
                pull(methodsClone, existing);

                onStateChange(source, target, methodsClone);
                return {
                    ...prevState,
                    methods: methodsClone,
                };
            });
        },
        [setState, onStateChange]
    );

    // If we did auto map, we notify the parent component that the data has changed
    useEffect(() => {
        if (didAutoMap) {
            // Emit state change but use the initial data since that's where the didAutoMap flag is set
            onStateChange(initialSource, initialTarget, initialMethods);
        }
    }, [didAutoMap]);

    return {
        isValid: () => isValid(state.methods),
        canAddToTarget: (ix: number) => canAddToTarget(state.methods, ix),
        canDropOnTarget: (ix: number) => canDropOnTarget(state.methods, ix),
        methods: state.methods,
        addToTarget,
        addToSource,
        removeTarget,
        removeSource,
        addMappingForTarget,
    };
};
