import RESTEditorComponent from "./RESTEditorComponent";
import {KIND_REST_API, KIND_REST_CLIENT, RESTResourceMetadata, RESTResourceSpec} from "./types";
import {getCounterValue, hasMethod, renameEntityReferences, resolveEntities, validate} from "./RESTUtils";
import {ResourceConfig, ResourceRole, ResourceType} from "@blockware/ui-web-types";

export const RESTAPIConfig: ResourceConfig<RESTResourceMetadata, RESTResourceSpec> = {
    kind: KIND_REST_API,
    name: 'REST API',
    role: ResourceRole.PROVIDES,
    type: ResourceType.SERVICE,
    componentType: RESTEditorComponent,
    consumableKind: KIND_REST_CLIENT,
    getCounterValue,
    resolveEntities,
    renameEntityReferences,
    hasMethod,
    validate
};

export default RESTAPIConfig;
