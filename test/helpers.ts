import { KIND_REST_API, RESTKindContext, RESTMethodContext, RESTResource } from '../src/web/types';
import {
    DSLConverters,
    DSLData,
    DSLDataTypeProperty,
    DSLEntityType,
    DSLMethod,
    DSLParameter,
    DSLType,
    DSLTypeHelper,
    KaplangWriter,
} from '@kapeta/kaplang-core';

export function makeAPIContext(methods: DSLMethod[], entities?: DSLData[]): RESTKindContext {
    return {
        resource: makeAPI(methods),
        entities: entities ?? [],
    };
}

export function makeAPI(methods: DSLMethod[]): RESTResource {
    return {
        kind: KIND_REST_API,
        metadata: {
            name: 'SomeAPI',
        },
        spec: {
            port: {
                type: 'rest',
            },
            methods: DSLConverters.toSchemaMethods(methods),
            source: {
                type: 'kaplang',
                version: '1.0.0',
                value: KaplangWriter.write(methods),
            },
        },
    };
}

export function makeMethod(name: string, args: DSLType[] = [], returnType?: DSLType): DSLMethod {
    const parameters: DSLParameter[] = args.map((type, ix) => {
        return {
            name: `arg_${ix}`,
            type,
            annotations: [{ type: DSLTypeHelper.isStringableType(type) ? '@Query' : '@Body' }],
        };
    });
    return {
        type: DSLEntityType.METHOD,
        name,
        description: '',
        parameters,
        annotations: [
            {
                type: '@POST',
                arguments: ['/test/path'],
            },
        ],
        returnType: returnType ?? 'void',
    };
}

export function makeEditContext(
    id: string,
    args: DSLType[] = [],
    responseType?: DSLType,
    entities?: DSLData[]
): RESTMethodContext {
    return {
        method: makeMethod(id, args, responseType),
        entities: entities ? entities : [],
    };
}

const mapper = ([name, property]: [string, any]): DSLDataTypeProperty => ({
    name,
    ...property,
});

export const ENTITIES: DSLData[] = [
    {
        type: DSLEntityType.ENUM,
        name: 'UserType',
        values: ['PERSON', 'STAFF'],
    },
    {
        type: DSLEntityType.DATATYPE,
        name: 'User',
        properties: [
            {
                name: 'id',
                type: 'string',
            },
            {
                name: 'type',
                type: 'UserType',
                defaultValue: {
                    type: 'enum',
                    value: 'UserType.PERSON',
                },
            },
        ],
    },
    {
        type: DSLEntityType.DATATYPE,
        name: 'Person',
        properties: Object.entries({
            id: {
                type: 'string',
            },
            name: {
                type: 'string',
            },
            staff: {
                type: 'Staff',
            },
        }).map(mapper),
    },
    {
        type: DSLEntityType.DATATYPE,
        name: 'Staff',
        properties: Object.entries({
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
        }).map(mapper),
    },
];

export const ENTITIES_ALT: DSLData[] = [
    {
        type: DSLEntityType.DATATYPE,
        name: 'User',
        properties: Object.entries({
            username: {
                type: 'string',
            },
            type: {
                type: 'string',
            },
        }).map(mapper),
    },
    {
        type: DSLEntityType.DATATYPE,
        name: 'Person',
        properties: Object.entries({
            username: {
                type: 'string',
            },
            fullName: {
                type: 'string',
            },
        }).map(mapper),
    },
    {
        type: DSLEntityType.DATATYPE,
        name: 'Staff',
        properties: Object.entries({
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
        }).map(mapper),
    },
];
