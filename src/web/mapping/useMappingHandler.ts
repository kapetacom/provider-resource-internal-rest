import { useCallback, useEffect, useState } from 'react';
import { cloneDeep, find, pull } from 'lodash';
import { ToastType, showToasty } from '@kapeta/ui-web-components';
import { ConnectionMethodMappingType, ConnectionMethodsMapping } from '@kapeta/ui-web-types';
import { RESTKindContext, RESTMethodEdit, RESTResourceSpec, getCompatibleRESTMethodsIssues } from '../types';
import { MappedMethod, MappingHandlerData, createEqualMapping, createSourceOnlyMapping } from './types';
import { getEntitiesToBeAddedForCopy } from './MappingUtils';
import { deleteRESTMethod, setRESTMethod } from '../RESTUtils';

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
    const [prevMethods, setPrevMethods] = useState(methods);
    const [prevSource, setPrevSource] = useState(source);
    const [prevTarget, setPrevTarget] = useState(target);
    if (prevMethods !== initialMethods) {
        setPrevMethods(methods);
        setMethods(initialMethods);
    }
    if (prevSource !== initialSource) {
        setPrevSource(source);
        setSource(initialSource);
    }
    if (prevTarget !== initialTarget) {
        setPrevTarget(target);
        setTarget(initialTarget);
    }

    const isValid = useCallback((): boolean => {
        for (let i = 0; i < methods.length; i++) {
            const method = methods[i];
            if (method.target && !method.mapped) {
                // All targets must be mapped to be valid
                return false;
            }
        }

        return methods.length > 0;
    }, [methods]);

    const toMappingData = useCallback((): ConnectionMethodsMapping => {
        const map: ConnectionMethodsMapping = {};
        methods.forEach((method) => {
            if (!method.source || !method.target || !method.mapped) {
                return;
            }

            map[method.source.id] = {
                targetId: method.target.id,
                type: ConnectionMethodMappingType.EXACT, // We only support exact at the moment
            };
        });

        return map;
    }, [methods]);

    const toData = useCallback((): MappingHandlerData => {
        return {
            source: source.resource,
            sourceEntities: source.entities,
            target: target.resource,
            targetEntities: target.entities,
            data: toMappingData(),
        };
    }, [source.entities, source.resource, target.entities, target.resource, toMappingData]);

    const onStateChange = useCallback((): void => {
        onDataChanged?.(toData());
    }, [onDataChanged, toData]);

    const canAddToTarget = useCallback(
        (ix: number): boolean => {
            const source = methods[ix].source;
            if (!source) {
                return false;
            }

            return !find(methods, (method) => {
                if (method.source === source) {
                    return false;
                }

                return method.target && method.target.id === source.id;
            });
        },
        [methods]
    );

    const canDropOnTarget = useCallback((ix: number): boolean => !!methods[ix].target, [methods]);

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

            // First add the method to the target resource
            setRESTMethod(targetClone.resource.spec, currentSource.id, newTarget);

            // Then add mapping for it
            methodsClone.splice(ix, 1, createEqualMapping(currentSource, newTarget));

            setTarget(targetClone);
            setMethods(methodsClone);

            onStateChange();
        },
        [methods, onStateChange, source.entities, target]
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

            // First add the method to the source resource
            setRESTMethod(sourceClone.resource.spec, currentTarget.id, newSource);

            // Then add mapping for it
            methodsClone.splice(ix, 1, createEqualMapping(newSource, currentTarget));

            setSource(sourceClone);
            setMethods(methodsClone);

            onStateChange();
        },
        [methods, onStateChange, source, target.entities]
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
            deleteRESTMethod(targetClone.resource.spec, currentTarget.id);

            // Then remove mapping for it
            const source = methodsClone[ix].source;
            if (source) {
                methodsClone.splice(ix, 1, createSourceOnlyMapping(source));
            } else {
                methodsClone.splice(ix, 1);
            }

            setTarget(targetClone);
            setMethods(methodsClone);

            onStateChange();
        },
        [methods, onStateChange, target]
    );

    const removeSource = useCallback(
        (ix: number): void => {
            const methodsClone = cloneDeep(methods);
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
                const sourceClone = cloneDeep(source);
                deleteRESTMethod(sourceClone.resource.spec as RESTResourceSpec, currentSource.id);
                setSource(sourceClone);

                // And remove the entire line
                pull(methodsClone, currentMethod);
            } else {
                methodsClone[ix].source = undefined;
                methodsClone[ix].sourceId = undefined;
                methodsClone[ix].mapped = false;
            }

            setMethods(methodsClone);

            onStateChange();
        },
        [methods, onStateChange, source]
    );

    const addMappingForTarget = useCallback(
        (ix: number, sourceMethod: RESTMethodEdit) => {
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
            methodsClone[ix].sourceId = sourceMethod.id;
            methodsClone[ix].mapped = true;

            const existing = find(methodsClone, { source: sourceMethod, mapped: false });
            pull(methodsClone, existing);

            setMethods(methodsClone);

            onStateChange();
        },
        [methods, onStateChange, source.entities, target.entities]
    );

    // If we did auto map, we notify the parent component that the data has changed
    useEffect(() => {
        if (didAutoMap) {
            onStateChange();
        }
    }, [didAutoMap, onStateChange]);

    return {
        methods,
        isValid,
        toData,
        toMappingData,
        canAddToTarget,
        canDropOnTarget,
        addToTarget,
        addToSource,
        removeTarget,
        removeSource,
        addMappingForTarget,
    };
};
