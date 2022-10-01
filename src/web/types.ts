import _ from "lodash";

import {
    isCompatibleTypes,
    SchemaEntity,
    SchemaEntryType,
    HTTPMethod,
    TypedValue,
    RESTMethod
} from "@blockware/ui-web-types";


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

export function convertToEditMethod(id:string, method:RESTMethod): RESTMethodEdit {
    const tmp:RESTMethodEdit = {...method, arguments:[], id};

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
    });

    tmp.arguments = args;

    return tmp;
}

export function isCompatibleRESTMethods(a:RESTMethodEdit, b:RESTMethodEdit, aEntities:SchemaEntity[], bEntities:SchemaEntity[]): boolean {
    if (!isCompatibleTypes(a.responseType, b.responseType, aEntities, bEntities)) {
        return false;
    }

    const aArgs = a.arguments.map((argument) => argument.type);
    const bArgs = b.arguments.map((argument) => argument.type);

    if (aArgs.length !== bArgs.length) {
        return false;
    }

    for(let i = 0; i < aArgs.length; i++) {
        if (!isCompatibleTypes(aArgs[i], bArgs[i], aEntities, bEntities)) {
            return false;
        }
    }

    return true;
}

export let KIND_REST_API = 'rest.blockware.com/v1/API';

export let KIND_REST_CLIENT = 'rest.blockware.com/v1/Client';
