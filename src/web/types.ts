import _ from 'lodash';

import {HTTPMethod, TypedValue, RESTMethod, TypeLike} from '@kapeta/ui-web-types';
import {Entity, getCompatibilityIssuesForTypes, isCompatibleTypes, Resource, ResourceSpec} from '@kapeta/schemas';

export interface RESTResourceSpec extends ResourceSpec {
    source?: TypedValue;
    methods: {
        [key: string]: RESTMethod;
    };
}

export interface RESTResource extends Resource {
    spec: RESTResourceSpec;
}

export interface RESTMethodArgumentEdit extends TypeLike {
    id: string;
    transport?: string;
}

export interface RESTMethodEdit {
    id: string;
    description: string;
    method: HTTPMethod;
    path: string;
    arguments: RESTMethodArgumentEdit[];
    responseType?: TypeLike;
}

export interface RESTMethodEditContext {
    method: RESTMethodEdit;
    entities: Entity[];
}

export interface RESTMethodContext {
    method: RESTMethod;
    entities: Entity[];
}

export interface RESTKindContext {
    resource: RESTResource;
    entities: Entity[];
}

export function toRESTKindContext(resource: RESTResource, entities: Entity[]): RESTKindContext {
    return {
        resource,
        entities,
    };
}

export function convertAllToEditMethods(resource: RESTResource): RESTMethodEdit[] {
    const out: RESTMethodEdit[] = [];
    _.forEach(resource.spec.methods, (method, methodId) => {
        out.push(convertToEditMethod(methodId, method));
    });

    return out;
}

export function convertToEditMethod(id: string, method: RESTMethod): RESTMethodEdit {
    const tmp: RESTMethodEdit = {
        id,
        description: method.description || '',
        method: method.method,
        arguments: [],
        path: method.path,
        responseType: method.responseType,
    };

    _.forEach(method.arguments, (arg, id) => {
        tmp.arguments.push({...arg, id});
    });

    return tmp;
}

export function convertToRestMethod(method: RESTMethodEdit): RESTMethod {
    const tmp: any = {..._.cloneDeep(method), arguments: {}};
    delete tmp.copyOf;
    delete tmp.id;

    const args = {};

    method.arguments.forEach((argument) => {
        args[argument.id] = _.cloneDeep(argument);
        delete args[argument.id].id;
    });

    tmp.arguments = args;

    return tmp;
}

export function getCompatibleRESTMethodsIssues(
    aContext: RESTMethodEditContext,
    bContext: RESTMethodEditContext
): string[] {
    const errors = [];
    const a = aContext.method;
    const b = bContext.method;
    if (!isCompatibleTypes(a.responseType, b.responseType, aContext.entities, bContext.entities)) {
        errors.push('Response types are not compatible');
    }

    const aArgs = a.arguments;
    const bArgs = b.arguments;

    if (aArgs.length !== bArgs.length) {
        errors.push('Argument counts is not compatible');
    }

    for (let i = 0; i < aArgs.length; i++) {
        const issues = getCompatibilityIssuesForTypes(aArgs[i], bArgs[i], aContext.entities, bContext.entities);
        if (bArgs[i] && issues.length > 0) {
            errors.push(`Argument ${i + 1} type is not compatible: ${issues[0]}`);
        }
    }

    return errors;
}

export function isCompatibleRESTMethods(a: RESTMethodEditContext, b: RESTMethodEditContext): boolean {
    return getCompatibleRESTMethodsIssues(a, b).length === 0;
}

export let KIND_REST_API = 'kapeta/resource-type-rest-api';

export let KIND_REST_CLIENT = 'kapeta/resource-type-rest-client';
