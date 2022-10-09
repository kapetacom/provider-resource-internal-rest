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
} from "@blockware/ui-web-types";

import {getCounterValue, hasMethod, resolveEntities, validate} from "./RESTUtils";
import RestAPIEditorComponent from "./RESTEditorComponent";
import APIToClientMapper from "./mapping/APIToClientMapper";
import InspectConnectionContent from "./inspectors/InspectConnectionContent";

const RestClientConfig: ResourceConfig<RESTResourceMetadata, RESTResourceSpec> = {
    kind: KIND_REST_CLIENT,
    name: 'REST Client',
    role: ResourceRole.CONSUMES,
    type: ResourceType.SERVICE,
    componentType: RestAPIEditorComponent,
    converters: [
        {
            fromKind: KIND_REST_API,
            mappingComponentType: APIToClientMapper,
            inspectComponentType: InspectConnectionContent,
            createFrom: (data: ResourceKind) => {
                return {...data, kind: KIND_REST_CLIENT}
            },
            validateMapping: (
                connection: BlockConnectionSpec<ConnectionMethodsMapping>,
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
                        !isCompatibleRESTMethods({method: fromMethod, entities: fromEntities}, {method:toMethod, entities: toEntities})) {
                        errors.push('Methods are not compatible');
                    }
                });

                if (targetMethods.length > 0) {
                    errors.push('One or more target method is not mapped: ' + targetMethods.join(', '));
                }

                return errors;
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