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
    const [methods, setMethods] = useState(initialMethods);
    const [source, setSource] = useState(initialSource);
    const [target, setTarget] = useState(initialTarget);

    // Update state when props change
    useEffect(() => {
        setMethods(initialMethods);
    }, [initialMethods]);
    useEffect(() => {
        setSource(initialSource);
    }, [initialSource]);
    useEffect(() => {
        setTarget(initialTarget);
    }, [initialTarget]);

    const onStateChange = (source: RESTKindContext, target: RESTKindContext, methods: MappedMethod[]): void => {
        onDataChanged && onDataChanged(toResultData(source, target, methods));
    };

    const addToTarget = useCallback(
        (ix: number): void => {
            const targetClone = cloneDeep(target);
            const methodsClone = cloneDeep(methods);

            const currentSource = methods[ix].source;
            if (!currentSource) {
                return;
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
                return;
            }

            target.entities.push(...entitiesToBeAdded);

            new RESTResourceEditor(targetClone.resource).setMethod(toId(currentSource), newTarget);

            // Then add mapping for it
            methodsClone.splice(ix, 1, createEqualMapping(currentSource, newTarget));

            setTarget(targetClone);
            setMethods(methodsClone);
            onStateChange(source, targetClone, methodsClone);
        },
        [methods, source.entities, target]
    );

    const addToSource = useCallback(
        (ix: number): void => {
            const sourceClone = cloneDeep(source);
            const methodsClone = cloneDeep(methods);

            const currentTarget = methodsClone[ix].target;
            if (!currentTarget) {
                return;
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
                return;
            }

            sourceClone.entities.push(...entitiesToBeAdded);

            new RESTResourceEditor(sourceClone.resource).setMethod(toId(currentTarget), newSource);

            // Then add mapping for it
            methodsClone.splice(ix, 1, createEqualMapping(newSource, currentTarget));

            setSource(sourceClone);
            setMethods(methodsClone);
            onStateChange(sourceClone, target, methodsClone);
        },
        [methods, source, target.entities]
    );

    const removeTarget = useCallback(
        (ix: number): void => {
            const targetClone = cloneDeep(target);
            const methodsClone = cloneDeep(methods);

            const currentTarget = methodsClone[ix].target;
            if (!currentTarget) {
                return;
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

            setTarget(targetClone);
            setMethods(methodsClone);

            onStateChange(source, targetClone, methodsClone);
        },
        [methods, target]
    );

    const removeSource = useCallback(
        (ix: number): void => {
            const methodsClone = cloneDeep(methods);
            const sourceClone = cloneDeep(source);
            const currentMethod = methodsClone[ix];
            const currentSource = currentMethod.source;
            if (!currentSource) {
                return;
            }

            if (!currentSource.copyOf) {
                // If source is not a copy from target
                methodsClone.push(createSourceOnlyMapping(currentSource));
            }

            if (currentMethod.target && currentMethod.target.copyOf) {
                // If the target is a copy

                // First remove the method from the source resource
                new RESTResourceEditor(sourceClone.resource).deleteMethod(toId(currentSource));
                setSource(sourceClone);
                // And remove the entire line
                pull(methodsClone, currentMethod);
            } else {
                methodsClone[ix].source = undefined;
                methodsClone[ix].sourceId = undefined;
                methodsClone[ix].mapped = false;
            }

            setMethods(methodsClone);
            onStateChange(sourceClone, target, methodsClone);
        },
        [methods, source]
    );

    const addMappingForTarget = useCallback(
        (ix: number, sourceMethod: DSLControllerMethod) => {
            const methodsClone = cloneDeep(methods);

            const currentTarget = methodsClone[ix].target;
            if (!currentTarget) {
                return;
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
                return;
            }

            methodsClone[ix].source = sourceMethod;
            methodsClone[ix].sourceId = toId(sourceMethod);
            methodsClone[ix].mapped = true;

            const existing = find(methodsClone, { source: sourceMethod, mapped: false });
            pull(methodsClone, existing);

            setMethods(methodsClone);

            onStateChange(source, target, methodsClone);
        },
        [methods, source.entities, target.entities]
    );

    // If we did auto map, we notify the parent component that the data has changed
    useEffect(() => {
        if (didAutoMap) {
            // Emit state change but use the initial data since that's where the didAutoMap flag is set
            onStateChange(initialSource, initialTarget, initialMethods);
        }
    }, [didAutoMap]);

    return {
        isValid: () => isValid(methods),
        canAddToTarget: (ix: number) => canAddToTarget(methods, ix),
        canDropOnTarget: (ix: number) => canDropOnTarget(methods, ix),
        methods,
        addToTarget,
        addToSource,
        removeTarget,
        removeSource,
        addMappingForTarget,
    };
};
