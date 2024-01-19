import { HTTPMethod, RESTMethod, RESTMethodArgument, TypeLike } from '@kapeta/ui-web-types';
import {
    convertToEditMethod,
    KIND_REST_API,
    RESTKindContext,
    RESTMethodEdit,
    RESTMethodEditContext,
    RESTResource,
} from '../src/web/types';
import { Entity, EntityDTO, EntityType } from '@kapeta/schemas';
import {EntityHelpers} from "@kapeta/kaplang-core";


export function makeAPIContext(methods: { [key: string]: RESTMethod }, entities?: Entity[]): RESTKindContext {
    return {
        resource: makeAPI(methods),
        entities: entities ? entities : [],
    };
}

export function makeAPI(methods: { [key: string]: RESTMethod }, entities?: Entity[]): RESTResource {
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

function toTypeLike(type: EntityHelpers.TypeOrString): TypeLike {
    return typeof type === 'string' ? { type } : type;
}

export function makeMethod(args: EntityHelpers.TypeOrString[] = [], responseType?: EntityHelpers.TypeOrString): RESTMethod {
    const argMap: Record<string, RESTMethodArgument> = {};
    args.forEach((type, ix) => {
        const typeLike = toTypeLike(type);
        const arg: RESTMethodArgument = {
            ...typeLike,
            transport: EntityHelpers.isStringableType(typeLike) ? 'QUERY' : 'BODY',
            optional: false,
        };
        argMap[`arg_${ix}`] = arg;
    });
    return {
        method: HTTPMethod.POST,
        description: '',
        arguments: argMap,
        path: '/',
        responseType: responseType ? toTypeLike(toTypeLike(responseType)) : { type: 'void' },
    };
}

export function makeEditContext(
    id: string,
    args: EntityHelpers.TypeOrString[] = [],
    responseType?: EntityHelpers.TypeOrString,
    entities?: Entity[]
): RESTMethodEditContext {
    return {
        method: makeEditMethod(id, args, responseType),
        entities: entities ? entities : [],
    };
}

export function makeEditMethod(id: string, args: EntityHelpers.TypeOrString[] = [], responseType?: EntityHelpers.TypeOrString): RESTMethodEdit {
    return convertToEditMethod(id, makeMethod(args, responseType));
}

export const ENTITIES: Entity[] = [
    {
        type: EntityType.Enum,
        name: 'UserType',
        values: ['PERSON', 'STAFF'],
    },
    {
        type: EntityType.Dto,
        name: 'User',
        properties: {
            id: {
                type: 'string',
            },
            type: {
                ref: 'UserType',
                defaultValue: 'UserType.PERSON',
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
            staff: {
                ref: 'Staff',
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
            type: {
                ref: 'UserType',
                defaultValue: 'UserType.PERSON',
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
            type: {
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
