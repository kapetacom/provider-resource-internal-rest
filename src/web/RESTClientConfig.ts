/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import _, { cloneDeep } from 'lodash';
import {
    convertToEditMethod,
    isCompatibleRESTMethods,
    KIND_REST_API,
    KIND_REST_CLIENT,
    RESTResource,
    RESTResourceSpec,
} from './types';

import {
    ConnectionMethodMappingType,
    ConnectionMethodsMapping,
    IResourceTypeProvider,
    ResourceRole,
    ResourceProviderType,
} from '@kapeta/ui-web-types';

import { Connection, Entity, Metadata, Resource } from '@kapeta/schemas';

import { getCounterValue, hasMethod, renameEntityReferences, resolveEntities, validate } from './RESTUtils';
import { RESTEditorComponent } from './RESTEditorComponent';
import APIToClientMapper from './mapping/APIToClientMapper';
import InspectConnectionContent from './inspectors/InspectConnectionContent';
const packageJson = require('../../package.json');

const RestClientConfig: IResourceTypeProvider<Metadata, RESTResourceSpec> = {
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
            createFrom: (data: Resource) => {
                if (!data.kind?.startsWith(KIND_REST_CLIENT)) {
                    throw new Error(`Invalid resource kind: ${data.kind}. Expected ${KIND_REST_CLIENT}`);
                }
                const copy = cloneDeep(data) as RESTResource;
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
            validateMapping: (
                connection: Connection,
                provider: Resource,
                consumer: Resource,
                fromEntities: Entity[],
                toEntities: Entity[]
            ): string[] => {
                const errors: string[] = [];

                if (!_.isObject(connection.mapping)) {
                    return [];
                }

                const connectionMapping = connection.mapping as ConnectionMethodsMapping;
                const consumerSpec = consumer.spec as RESTResourceSpec;
                const providerSpec = provider.spec as RESTResourceSpec;

                const targetMethods = consumerSpec.methods ? Object.keys(consumerSpec.methods) : [];

                const oldMapping = connectionMapping;
                _.forEach(oldMapping, (mapping, sourceMethodId) => {
                    if (!providerSpec.methods || !providerSpec.methods[sourceMethodId]) {
                        // Some methods are gone - ignore and remove
                        errors.push('Missing source method');
                        return;
                    }

                    if (!consumerSpec.methods || !consumerSpec.methods[mapping.targetId]) {
                        errors.push('Missing target method');
                        return;
                    }

                    _.pull(targetMethods, mapping.targetId);

                    const fromMethod = convertToEditMethod(sourceMethodId, providerSpec.methods[sourceMethodId]);
                    const toMethod = convertToEditMethod(mapping.targetId, consumerSpec.methods[mapping.targetId]);

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
            createMapping: (
                from: Resource,
                to: Resource,
                fromEntities: Entity[],
                toEntities: Entity[]
            ): ConnectionMethodsMapping => {
                const newMapping: ConnectionMethodsMapping = {};
                if (!to.spec.methods || !from.spec.methods) {
                    return newMapping;
                }

                Object.keys(from.spec.methods).forEach((sourceMethodId) => {
                    if (!to.spec.methods[sourceMethodId]) {
                        return;
                    }

                    const fromMethod = convertToEditMethod(sourceMethodId, from.spec.methods[sourceMethodId]);
                    const toMethod = convertToEditMethod(sourceMethodId, to.spec.methods[sourceMethodId]);

                    const wasCompatible = isCompatibleRESTMethods(
                        {
                            method: fromMethod,
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
            updateMapping: (
                connection: Connection,
                provider: Resource,
                consumer: Resource
            ): ConnectionMethodsMapping => {
                const newMapping: ConnectionMethodsMapping = {};
                const consumerSpec = consumer.spec as RESTResourceSpec;
                const providerSpec = provider.spec as RESTResourceSpec;

                if (!_.isObject(connection.mapping) || !providerSpec?.methods || !consumerSpec?.methods) {
                    return newMapping;
                }

                const connectionMapping = connection.mapping as ConnectionMethodsMapping;

                const oldMapping = connectionMapping;
                _.forEach(oldMapping, (mapping, sourceMethodId) => {
                    if (!providerSpec.methods?.[sourceMethodId] || !consumerSpec.methods?.[mapping.targetId]) {
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
        return resolveEntities({ resource: resource as RESTResource, entities: [] });
    },
    validate: (resource, entities) => {
        return validate({ resource: resource as RESTResource, entities });
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
};

export default RestClientConfig;
