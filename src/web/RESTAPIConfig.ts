import {RESTEditorComponent} from './RESTEditorComponent';
import {KIND_REST_API, KIND_REST_CLIENT, RESTResourceSpec} from './types';
import {getCounterValue, hasMethod, renameEntityReferences, resolveEntities, validate} from './RESTUtils';
import {IResourceTypeProvider, ResourceRole, ResourceProviderType} from '@kapeta/ui-web-types';
import {Metadata} from '@kapeta/schemas';

const packageJson = require('../../package.json');

export const RESTAPIConfig: IResourceTypeProvider<Metadata, RESTResourceSpec> = {
    kind: KIND_REST_API,
    version: packageJson.version,
    title: 'REST API',
    role: ResourceRole.PROVIDES,
    type: ResourceProviderType.INTERNAL,
    editorComponent: RESTEditorComponent,
    consumableKind: KIND_REST_CLIENT,
    getCounterValue,
    hasMethod,
    resolveEntities: (resource) => {
        return resolveEntities({resource, entities: []});
    },
    renameEntityReferences,
    validate: (resource, entities) => {
        return validate({resource, entities});
    },
    definition: {
        kind: 'core/resource-type-internal',
        metadata: {
            name: 'kapeta/resource-type-rest-api',
            title: 'REST API',
            description: 'Provides REST API in your plans',
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

export default RESTAPIConfig;
