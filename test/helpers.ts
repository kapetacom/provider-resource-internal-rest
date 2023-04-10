import {
    HTTPMethod,
    RESTMethod, 
} from "@kapeta/ui-web-types";
import {
    convertToEditMethod,
    KIND_REST_API, RESTKindContext,
    RESTMethodEdit,
    RESTMethodEditContext, RESTResource
} from "../src/web/types";
import {Entity, EntityDTO, EntityType, EntityValueType, isStringableType} from "@kapeta/schemas";

export function makeAPIContext(methods:{[key: string]: RESTMethod}, entities?:Entity[]):RESTKindContext {
    return {
        resource: makeAPI(methods),
        entities:  entities ? entities : []
    }
}


export function makeAPI(methods:{[key: string]: RESTMethod}, entities?:Entity[]):RESTResource {
    return  {
        kind: KIND_REST_API,
        metadata: {
            name: 'SomeAPI'
        },
        spec: {
            port: {
                type: 'rest'
            },
            methods
        }
    }
}

export function makeMethod(args:EntityValueType[] = [], responseType?:EntityValueType):RESTMethod {
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

export function makeEditContext(id:string, args:EntityValueType[] = [], responseType?:EntityValueType, entities?:Entity[]):RESTMethodEditContext {
    return {
        method: makeEditMethod(id, args, responseType),
        entities: entities ? entities : []
    }
}

export function makeEditMethod(id:string, args:EntityValueType[] = [], responseType?:EntityValueType):RESTMethodEdit {
    return convertToEditMethod(id, makeMethod(args, responseType));
}

export const ENTITIES:EntityDTO[] = [
    {
        type: EntityType.Dto,
        name: 'User',
        properties: {
            id: {
                type:'string'
            }
        }
    },
    {
        type: EntityType.Dto,
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
        type: EntityType.Dto,
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
                type: {ref: 'Staff'}
            }
        }
    }
]

export const ENTITIES_ALT:EntityDTO[] = [
    {
        type: EntityType.Dto,
        name: 'User',
        properties: {
            username: {
                type:'string'
            }
        }
    },
    {
        type: EntityType.Dto,
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
        type: EntityType.Dto,
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
                type: {ref: 'Staff'}
            }
        }
    }
]