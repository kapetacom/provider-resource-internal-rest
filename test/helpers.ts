import {HTTPMethod, RESTMethod, RESTMethodArgument, TypeLike} from '@kapeta/ui-web-types';
import {
    convertToEditMethod,
    KIND_REST_API,
    RESTKindContext,
    RESTMethodEdit,
    RESTMethodEditContext,
    RESTResource,
} from '../src/web/types';
import {Entity, EntityDTO, EntityType, isStringableType, typeName, TypeOrString} from '@kapeta/schemas';

export function makeAPIContext(methods: {[key: string]: RESTMethod}, entities?: Entity[]): RESTKindContext {
    return {
        resource: makeAPI(methods),
        entities: entities ? entities : [],
    };
}

export function makeAPI(methods: {[key: string]: RESTMethod}, entities?: Entity[]): RESTResource {
    return {
        kind: KIND_REST_API,
        metadata: {
            name: 'SomeAPI',
        },
        spec: {
            port: {
                type: 'rest',
            },
            methods,
        },
    };
}

function toTypeLike(type: TypeOrString): TypeLike {
    return typeof type === 'string' ? {type} : type;
}

export function makeMethod(args: TypeOrString[] = [], responseType?: TypeOrString): RESTMethod {
    const argMap = {};
    args.forEach((type, ix) => {
        const typeLike = toTypeLike(type);
        const arg: RESTMethodArgument = {
            ...typeLike,
            transport: isStringableType(typeName(typeLike)) ? 'QUERY' : 'BODY',
        };
        argMap[`arg_${ix}`] = arg;
    });
    return {
        method: HTTPMethod.POST,
        description: '',
        arguments: argMap,
        path: '/',
        responseType: responseType ? toTypeLike(toTypeLike(responseType)) : {type: 'void'},
    };
}

export function makeEditContext(
    id: string,
    args: TypeOrString[] = [],
    responseType?: TypeOrString,
    entities?: Entity[]
): RESTMethodEditContext {
    return {
        method: makeEditMethod(id, args, responseType),
        entities: entities ? entities : [],
    };
}

export function makeEditMethod(id: string, args: TypeOrString[] = [], responseType?: TypeOrString): RESTMethodEdit {
    return convertToEditMethod(id, makeMethod(args, responseType));
}

export const ENTITIES: EntityDTO[] = [
    {
        type: EntityType.Dto,
        name: 'User',
        properties: {
            id: {
                type: 'string',
            },
        },
    },
    {
        type: EntityType.Dto,
        name: 'Person',
        properties: {
            id: {
                type: 'string',
            },
            name: {
                type: 'string',
            },
        },
    },
    {
        type: EntityType.Dto,
        name: 'Staff',
        properties: {
            id: {
                type: 'string',
            },
            name: {
                type: 'string',
            },
            department: {
                type: 'string',
            },
            boss: {
                ref: 'Staff',
            },
        },
    },
];

export const ENTITIES_ALT: EntityDTO[] = [
    {
        type: EntityType.Dto,
        name: 'User',
        properties: {
            username: {
                type: 'string',
            },
        },
    },
    {
        type: EntityType.Dto,
        name: 'Person',
        properties: {
            username: {
                type: 'string',
            },
            fullName: {
                type: 'string',
            },
        },
    },
    {
        type: EntityType.Dto,
        name: 'Staff',
        properties: {
            username: {
                type: 'string',
            },
            fullName: {
                type: 'string',
            },
            section: {
                type: 'string',
            },
            manager: {
                ref: 'Staff',
            },
        },
    },
];
