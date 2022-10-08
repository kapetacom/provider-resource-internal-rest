import {
    HTTPMethod,
    isStringableType,
    RESTMethod, SchemaDTO,
    SchemaEntity,
    SchemaEntityType,
    SchemaEntryType
} from "@blockware/ui-web-types";
import {convertToEditMethod, KIND_REST_API, RESTMethodEdit} from "../src/web/types";

export function makeAPI(methods:{[key: string]: RESTMethod}) {
    return {
        kind: KIND_REST_API,
        metadata: {
            name: 'SomeAPI'
        },
        spec: {
            methods
        }
    }
}

export function makeMethod(args:SchemaEntryType[] = [], responseType?:SchemaEntryType):RESTMethod {
    const argMap = {};
    args.forEach((type, ix) => {
        argMap[`arg_${ix}`] = {
            type,
            transport: isStringableType(type) ? 'QUERY' : 'BODY'
        };
    })
    return {
        method: HTTPMethod.POST,
        description: '',
        arguments: argMap,
        path: '/',
        responseType
    }
}

export function makeEditMethod(id:string, args:SchemaEntryType[] = [], responseType?:SchemaEntryType):RESTMethodEdit {
    return convertToEditMethod(id, makeMethod(args, responseType));
}

export const ENTITIES:SchemaDTO[] = [
    {
        type: SchemaEntityType.DTO,
        name: 'User',
        properties: {
            id: {
                type:'string'
            }
        }
    },
    {
        type: SchemaEntityType.DTO,
        name: 'Person',
        properties: {
            id: {
                type:'string'
            },
            name: {
                type:'string'
            }
        }
    },
    {
        type: SchemaEntityType.DTO,
        name: 'Staff',
        properties: {
            id: {
                type:'string'
            },
            name: {
                type:'string'
            },
            department: {
                type:'string'
            },
            boss: {
                type: {$ref: 'Staff'}
            }
        }
    }
]

export const ENTITIES_ALT:SchemaDTO[] = [
    {
        type: SchemaEntityType.DTO,
        name: 'User',
        properties: {
            username: {
                type:'string'
            }
        }
    },
    {
        type: SchemaEntityType.DTO,
        name: 'Person',
        properties: {
            username: {
                type:'string'
            },
            fullName: {
                type:'string'
            }
        }
    },
    {
        type: SchemaEntityType.DTO,
        name: 'Staff',
        properties: {
            username: {
                type:'string'
            },
            fullName: {
                type:'string'
            },
            section: {
                type:'string'
            },
            manager: {
                type: {$ref: 'Staff'}
            }
        }
    }
]