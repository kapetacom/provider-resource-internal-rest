import _ from "lodash";

import {
    isCompatibleTypes,
    SchemaEntity,
    SchemaEntryType,
    HTTPMethod,
    TypedValue,
    RESTMethod, getCompatibilityIssuesForTypes, ResourceKind
} from "@kapeta/ui-web-types";


export interface RESTResourceMetadata {
    name: string
}

export interface RESTResourceSpec {
    source?: TypedValue
    methods: {
        [key: string]: RESTMethod
    }
}

export interface RESTMethodArgumentEdit {
    id: string
    type: SchemaEntryType,
    transport?: string
}

export interface RESTMethodEdit {
    id: string
    description: string
    method: HTTPMethod
    path: string
    arguments: RESTMethodArgumentEdit[]
    responseType?: SchemaEntryType
}


export interface RESTMethodEditContext {
    method: RESTMethodEdit
    entities: SchemaEntity[]
}

export interface RESTMethodContext {
    method: RESTMethod
    entities: SchemaEntity[]
}

export interface RESTKindContext {
    resource: ResourceKind<RESTResourceSpec, RESTResourceMetadata>
    entities:SchemaEntity[]
}

export function toRESTKindContext(resource: ResourceKind<RESTResourceSpec, RESTResourceMetadata>, entities:SchemaEntity[]):RESTKindContext {
    return {
        resource,
        entities
    };
}

export function convertAllToEditMethods(resource: ResourceKind<RESTResourceSpec, RESTResourceMetadata>):RESTMethodEdit[] {
    const out:RESTMethodEdit[] = [];
    _.forEach(resource.spec.methods, (method, methodId) => {
        out.push(convertToEditMethod(methodId, method));
    });

    return out;
}

export function convertToEditMethod(id:string, method:RESTMethod): RESTMethodEdit {
    const tmp:RESTMethodEdit = {id,
        description: method.description || '',
        method: method.method,
        arguments: [],
        path: method.path,
        responseType: method.responseType
    };

    _.forEach(method.arguments,((arg, id) => {
        tmp.arguments.push({...arg, id});
    }));

    return tmp;
}

export function convertToRestMethod(method: RESTMethodEdit):RESTMethod {
    const tmp:any = {..._.cloneDeep(method), arguments:{}};
    delete tmp.copyOf;
    delete tmp.id;

    const args = {};

    method.arguments.forEach((argument) => {
        args[argument.id] = _.cloneDeep(argument);
        delete args[argument.id].id
    });

    tmp.arguments = args;

    return tmp;
}

export function getCompatibleRESTMethodsIssues(aContext:RESTMethodEditContext, bContext:RESTMethodEditContext): string[] {
    const errors = [];
    const a = aContext.method;
    const b = bContext.method;
    if (!isCompatibleTypes(a.responseType, b.responseType, aContext.entities, bContext.entities)) {
        errors.push('Response types are not compatible');
    }

    const aArgs = a.arguments.map((argument) => argument.type);
    const bArgs = b.arguments.map((argument) => argument.type);

    if (aArgs.length !== bArgs.length) {
        errors.push('Argument counts is not compatible');
    }

    for(let i = 0; i < aArgs.length; i++) {

        const issues = getCompatibilityIssuesForTypes(aArgs[i], bArgs[i], aContext.entities, bContext.entities)
        if (bArgs[i] && issues.length > 0) {
            errors.push(`Argument ${i+1} type is not compatible: ${issues[0]}`);
        }
    }

    return errors;
}

export function isCompatibleRESTMethods(a:RESTMethodEditContext, b:RESTMethodEditContext): boolean {
    return getCompatibleRESTMethodsIssues(a, b).length === 0;
}

export let KIND_REST_API = 'kapeta/resource-type-rest-api';

export let KIND_REST_CLIENT = 'kapeta/resource-type-rest-client';
