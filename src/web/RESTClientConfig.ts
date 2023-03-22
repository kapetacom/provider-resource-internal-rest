import _ from "lodash";
import {
    convertToEditMethod,
    isCompatibleRESTMethods,
    KIND_REST_API,
    KIND_REST_CLIENT,
    RESTResourceMetadata,
    RESTResourceSpec
} from "./types";

import {
    BlockConnectionSpec,
    ConnectionMethodMappingType,
    ConnectionMethodsMapping,
    ResourceConfig,
    ResourceKind,
    ResourceRole,
    ResourceType,
    SchemaEntity
} from "@kapeta/ui-web-types";

import {getCounterValue, hasMethod, resolveEntities, validate} from "./RESTUtils";
import {RESTEditorComponent} from "./RESTEditorComponent";
import APIToClientMapper from "./mapping/APIToClientMapper";
import InspectConnectionContent from "./inspectors/InspectConnectionContent";

const packageJson = require('../../package.json');

const RestClientConfig: ResourceConfig<RESTResourceMetadata, RESTResourceSpec> = {
    kind: KIND_REST_CLIENT,
    version: packageJson.version,
    title: 'REST Client',
    role: ResourceRole.CONSUMES,
    type: ResourceType.SERVICE,
    componentType: RESTEditorComponent,
    converters: [
        {
            fromKind: KIND_REST_API,
            mappingComponentType: APIToClientMapper,
            inspectComponentType: InspectConnectionContent,
            createFrom: (data: ResourceKind) => {
                if (!data.kind?.startsWith(KIND_REST_CLIENT)) {
                    throw new Error(`Invalid resource kind: ${data.kind}. Expected ${KIND_REST_CLIENT}`)
                }
                return {...data}
            },
            validateMapping: (
                connection: BlockConnectionSpec,
                from: ResourceKind<RESTResourceSpec>,
                to: ResourceKind<RESTResourceSpec>,
                fromEntities: SchemaEntity[],
                toEntities: SchemaEntity[]): string[] => {
                const errors: string[] = [];

                if (!_.isObject(connection.mapping)) {
                    return [];
                }

                const targetMethods = Object.keys(to.spec.methods);

                const oldMapping = connection.mapping;
                _.forEach(oldMapping, (mapping, sourceMethodId) => {

                    if (!from.spec.methods[sourceMethodId]) {
                        //Some methods are gone - ignore and remove
                        errors.push('Missing source method');
                        return;
                    }

                    if (!to.spec.methods[mapping.targetId]) {
                        errors.push('Missing target method');
                        return;
                    }

                    _.pull(targetMethods, mapping.targetId);

                    const fromMethod = convertToEditMethod(sourceMethodId, from.spec.methods[sourceMethodId]);
                    const toMethod = convertToEditMethod(mapping.targetId, to.spec.methods[mapping.targetId]);

                    if (mapping.type === ConnectionMethodMappingType.EXACT &&
                        !isCompatibleRESTMethods({method: fromMethod, entities: fromEntities}, {
                            method: toMethod,
                            entities: toEntities
                        })) {
                        errors.push('Methods are not compatible');
                    }
                });

                if (targetMethods.length > 0) {
                    errors.push('One or more target method is not mapped: ' + targetMethods.join(', '));
                }

                return errors;
            },
            createMapping: (from: ResourceKind<RESTResourceSpec>,
                            to: ResourceKind<RESTResourceSpec>,
                            fromEntities: SchemaEntity[],
                            toEntities: SchemaEntity[]): ConnectionMethodsMapping => {
                const newMapping = {};
                Object.keys(from.spec.methods).forEach(sourceMethodId => {
                    if (!to.spec.methods[sourceMethodId]) {
                        return;
                    }

                    const fromMethod = convertToEditMethod(sourceMethodId, from.spec.methods[sourceMethodId]);
                    const toMethod = convertToEditMethod(sourceMethodId, to.spec.methods[sourceMethodId]);

                    const wasCompatible = isCompatibleRESTMethods(
                        {
                            method: fromMethod,
                            entities: fromEntities
                        },
                        {
                            method: toMethod,
                            entities: toEntities
                        }
                    );

                    if (!wasCompatible) {
                        return;
                    }

                    newMapping[sourceMethodId] = {
                        targetId: sourceMethodId,
                        type: ConnectionMethodMappingType.EXACT
                    };
                });

                return newMapping;
            },
            updateMapping: (
                connection: BlockConnectionSpec<ConnectionMethodsMapping>,
                from: ResourceKind<RESTResourceSpec>,
                to: ResourceKind<RESTResourceSpec>): ConnectionMethodsMapping => {
                const newMapping = {};

                if (!_.isObject(connection.mapping)) {
                    return newMapping;
                }

                const oldMapping = connection.mapping;
                _.forEach(oldMapping, (mapping, sourceMethodId) => {
                    if (!from.spec.methods[sourceMethodId] ||
                        !to.spec.methods[mapping.targetId]) {
                        //Some methods are gone - ignore and remove
                        return;
                    }

                    newMapping[sourceMethodId] = mapping;
                });

                return newMapping;
            }
        }
    ],
    getCounterValue,
    hasMethod,
    resolveEntities: (resource) => {
        return resolveEntities({resource, entities: []})
    },
    validate: (resource, entities) => {
        return validate({resource, entities})
    }
};

export default RestClientConfig;