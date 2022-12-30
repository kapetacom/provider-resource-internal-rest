import RESTEditorComponent from "./RESTEditorComponent";
import {KIND_REST_API, KIND_REST_CLIENT, RESTResourceMetadata, RESTResourceSpec} from "./types";
import {getCounterValue, hasMethod, renameEntityReferences, resolveEntities, validate} from "./RESTUtils";
import {ResourceConfig, ResourceRole, ResourceType} from "@blockware/ui-web-types";
const packageJson = require('../../package.json');

export const RESTAPIConfig: ResourceConfig<RESTResourceMetadata, RESTResourceSpec> = {
    kind: KIND_REST_API,
    version: packageJson.version,
    title: 'REST API',
    role: ResourceRole.PROVIDES,
    type: ResourceType.SERVICE,
    componentType: RESTEditorComponent,
    consumableKind: KIND_REST_CLIENT,
    getCounterValue,
    hasMethod,
    resolveEntities: (resource) => {
        return resolveEntities({resource, entities: []})
    },
    renameEntityReferences,
    validate: (resource, entities) => {
        return validate({resource, entities})
    }
};

export default RESTAPIConfig;
