import {
    HTTPMethod,
    isStringableType, ResourceKind,
    RESTMethod, SchemaDTO,
    SchemaEntity,
    SchemaEntityType,
    SchemaEntryType
} from "@kapeta/ui-web-types";
import {
    convertToEditMethod,
    KIND_REST_API, RESTKindContext,
    RESTMethodContext,
    RESTMethodEdit,
    RESTMethodEditContext, RESTResourceMetadata, RESTResourceSpec
} from "../src/web/types";

export function makeAPIContext(methods:{[key: string]: RESTMethod}, entities?:SchemaEntity[]):RESTKindContext {
    return {
        resource: makeAPI(methods),
        entities:  entities ? entities : []
    }
}


export function makeAPI(methods:{[key: string]: RESTMethod}, entities?:SchemaEntity[]):ResourceKind<RESTResourceSpec, RESTResourceMetadata> {
    return  {
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

export function makeEditContext(id:string, args:SchemaEntryType[] = [], responseType?:SchemaEntryType, entities?:SchemaEntity[]):RESTMethodEditContext {
    return {
        method: makeEditMethod(id, args, responseType),
        entities: entities ? entities : []
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