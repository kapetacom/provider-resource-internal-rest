/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import _, { cloneDeep } from 'lodash';
import { isCompatibleRESTMethods, KIND_REST_API, KIND_REST_CLIENT, RESTResourceSpec } from './types';

import {
    ConnectionMethodMappingType,
    ConnectionMethodsMapping,
    IResourceTypeProvider,
    ResourceRole,
    ResourceProviderType,
} from '@kapeta/ui-web-types';

import { Metadata } from '@kapeta/schemas';

import {
    getCounterValue,
    hasMethod,
    parseMethodsFromResource,
    renameEntityReferences,
    resolveEntities,
    validate,
} from './RESTUtils';
import { RESTEditorComponent } from './RESTEditorComponent';
import APIToClientMapper from './mapping/APIToClientMapper';
import { InspectConnectionContent } from './inspectors/InspectConnectionContent';
import { DSLConverters, DSLData } from '@kapeta/kaplang-core';
import { toId } from './mapping/types';
const packageJson = require('../../package.json');

const RestClientConfig: IResourceTypeProvider<Metadata, RESTResourceSpec, DSLData> = {
    kind: KIND_REST_CLIENT,
    version: packageJson.version,
    title: 'REST Client',
    role: ResourceRole.CONSUMES,
    type: ResourceProviderType.INTERNAL,
    editorComponent: RESTEditorComponent,
    converters: [
        {
            fromKind: KIND_REST_API,
            mappingComponentType: APIToClientMapper,
            inspectComponentType: InspectConnectionContent,
            createFrom: (data) => {
                if (!data.kind?.startsWith(KIND_REST_CLIENT)) {
                    throw new Error(`Invalid resource kind: ${data.kind}. Expected ${KIND_REST_CLIENT}`);
                }
                const copy = cloneDeep(data);
                if (!copy.spec) {
                    copy.spec = {
                        port: {
                            type: 'rest',
                        },
                    };
                }

                if (!copy.spec.methods) {
                    copy.spec.methods = {};
                }

                return copy;
            },
            validateMapping: (connection, provider, consumer, fromEntities, toEntities): string[] => {
                const errors: string[] = [];

                if (!_.isObject(connection.mapping)) {
                    return [];
                }

                const connectionMapping = connection.mapping as ConnectionMethodsMapping;
                const sourceMethods = parseMethodsFromResource(provider);
                let targetMethods = parseMethodsFromResource(consumer);

                Object.entries(connectionMapping).forEach(([sourceMethodId, mapping]) => {
                    const fromMethod = sourceMethods.find((method) => toId(method) === sourceMethodId);
                    const toMethod = targetMethods.find((method) => toId(method) === mapping.targetId);
                    if (!fromMethod) {
                        // Some methods are gone - ignore and remove
                        errors.push('Missing source method');
                        return;
                    }

                    if (!toMethod) {
                        errors.push('Missing target method');
                        return;
                    }

                    targetMethods = targetMethods.filter((m) => toId(m) !== mapping.targetId);

                    if (
                        mapping.type === ConnectionMethodMappingType.EXACT &&
                        !isCompatibleRESTMethods(
                            { method: fromMethod, entities: fromEntities },
                            {
                                method: toMethod,
                                entities: toEntities,
                            }
                        )
                    ) {
                        errors.push('Methods are not compatible');
                    }
                });

                if (targetMethods.length > 0) {
                    errors.push('One or more target method is not mapped: ' + targetMethods.join(', '));
                }

                return errors;
            },
            createMapping: (from, to, fromEntities, toEntities): ConnectionMethodsMapping => {
                const newMapping: ConnectionMethodsMapping = {};
                const sourceMethods = parseMethodsFromResource(from);
                const targetMethods = parseMethodsFromResource(to);
                if (!targetMethods || !sourceMethods) {
                    return newMapping;
                }

                sourceMethods.forEach((sourceMethod) => {
                    const sourceMethodId = toId(sourceMethod);
                    const toMethod = targetMethods.find((method) => toId(method) === sourceMethodId);
                    if (!toMethod) {
                        return;
                    }

                    const wasCompatible = isCompatibleRESTMethods(
                        {
                            method: sourceMethod,
                            entities: fromEntities,
                        },
                        {
                            method: toMethod,
                            entities: toEntities,
                        }
                    );

                    if (!wasCompatible) {
                        return;
                    }

                    newMapping[sourceMethodId] = {
                        targetId: sourceMethodId,
                        type: ConnectionMethodMappingType.EXACT,
                    };
                });
                return newMapping;
            },
            updateMapping: (connection, provider, consumer): ConnectionMethodsMapping => {
                const newMapping: ConnectionMethodsMapping = {};

                if (!_.isObject(connection.mapping)) {
                    return newMapping;
                }

                const sourceMethods = parseMethodsFromResource(provider);
                const targetMethods = parseMethodsFromResource(consumer);

                const connectionMapping = connection.mapping as ConnectionMethodsMapping;

                Object.entries(connectionMapping).forEach(([sourceMethodId, mapping]) => {
                    const sourceMethod = sourceMethods.find((method) => toId(method) === sourceMethodId);
                    const targetMethod = targetMethods.find((method) => toId(method) === mapping.targetId);

                    if (!sourceMethod || !targetMethod) {
                        // Some methods are gone - ignore and remove
                        return;
                    }

                    newMapping[sourceMethodId] = mapping;
                });

                return newMapping;
            },
        },
    ],
    getCounterValue,
    hasMethod,
    renameEntityReferences,
    resolveEntities: (resource) => {
        return resolveEntities({ resource, entities: [] }).map((entity) => DSLConverters.fromDSLType(entity));
    },
    validate: (resource, entities) => {
        return validate({ resource, entities });
    },
    definition: {
        kind: 'core/resource-type-internal',
        metadata: {
            name: 'kapeta/resource-type-rest-client',
            title: 'REST Client',
            description: 'Provides REST Clients in your plans',
        },
        spec: {
            ports: [
                {
                    name: 'rest',
                    type: 'rest',
                },
            ],
        },
    },
    capabilities: {
        directDSL: true,
    },
};

export default RestClientConfig;
