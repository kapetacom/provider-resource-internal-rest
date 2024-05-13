import React from 'react';
import { DSLDiffEditor, DSLEntityType } from '@kapeta/ui-web-components';
import { DSLConverters, DSLDataTypeProperty, DSLEntity, KaplangWriter, TypeLike } from '@kapeta/kaplang-core';
import { Box } from '@mui/material';
import APIToClientMapper from '../src/web/mapping/APIToClientMapper';
import { RESTResource } from '../src/web/types';
import { DSLControllerMethod } from 'web/mapping/types';

export default {
    title: 'Diff editor',
};

const mapper = ([name, property]: [string, TypeLike]): DSLDataTypeProperty => ({
    name,
    ...property,
});

const addTaskMethod: DSLControllerMethod = {
    type: DSLEntityType.METHOD,
    name: 'addTaskMethod',
    annotations: [
        {
            type: '@POST',
            arguments: ['/tasks/{id}'],
        },
    ],
    description: 'Adds a task to the system',
    returnType: 'void',
    parameters: [
        {
            name: 'id',
            annotations: [
                {
                    type: '@Path',
                },
            ],
            type: 'string',
        },
        {
            name: 'task',
            annotations: [
                {
                    type: '@Body',
                },
            ],
            type: 'Task',
        },
    ],
};

const API_KIND = 'kapeta/resource-type-rest-api';
const CLIENT_KIND = 'kapeta/resource-type-rest-client';
const RESTClientResource: RESTResource = {
    kind: CLIENT_KIND,
    metadata: {
        name: 'MyRESTClient',
    },
    spec: {
        port: {
            type: 'rest',
        },
        methods: DSLConverters.toSchemaMethods([addTaskMethod]),
        source: {
            type: 'kaplang',
            version: '1.0.0',
            value: KaplangWriter.write([addTaskMethod]),
        },
    },
};

const RESTApiResource: RESTResource = {
    kind: API_KIND,
    metadata: {
        name: 'MyRESTAPI',
    },
    spec: {
        port: {
            type: 'rest',
        },
        methods: DSLConverters.toSchemaMethods([addTaskMethod]),
        source: {
            type: 'kaplang',
            version: '1.0.0',
            value: KaplangWriter.write([addTaskMethod]),
        },
    },
};

export const SimpleDiff = () => {
    const apiEntities: DSLEntity[] = [
        {
            type: DSLEntityType.DATATYPE,
            name: 'Task',
            properties: Object.entries({
                id: {
                    type: 'string',
                },
                description: {
                    type: 'string',
                },
                state: {
                    ref: 'TaskState',
                },
            }).map(mapper),
        },
        {
            type: DSLEntityType.ENUM,
            name: 'TaskState',
            values: ['PENDING', 'DONE'],
        },
    ];
    const clientEntities = [
        {
            type: DSLEntityType.DATATYPE,
            name: 'Task',
            properties: Object.entries({
                id: {
                    type: 'number',
                },
                description: {
                    type: 'string',
                },
                state: {
                    ref: 'TaskState',
                },
            }).map(mapper),
        },
        {
            type: DSLEntityType.ENUM,
            name: 'TaskState',
            values: ['PENDING', 'DONE'],
        },
    ];
    return (
        <div style={{ padding: '25px', width: '750px', height: '100%' }}>
            <APIToClientMapper
                title={'My Connection'}
                source={RESTApiResource}
                target={RESTClientResource}
                onDataChanged={(change) => console.log('Data changed', change)}
                sourceEntities={apiEntities}
                targetEntities={clientEntities}
            />
        </div>
    );
};

export const RefNameDiff = () => {
    const apiEntities: DSLEntity[] = [
        {
            type: DSLEntityType.DATATYPE,
            name: 'Task',
            properties: Object.entries({
                id: {
                    type: 'string',
                },
                description: {
                    type: 'string',
                },
                state: {
                    ref: 'TaskState',
                },
            }).map(mapper),
        },
        {
            type: DSLEntityType.ENUM,
            name: 'TaskState',
            values: ['PENDING', 'DONE'],
        },
    ];
    const clientEntities = [
        {
            type: DSLEntityType.DATATYPE,
            name: 'Task',
            properties: Object.entries({
                id: {
                    type: 'string',
                },
                description: {
                    type: 'string',
                },
                state: {
                    ref: 'TaskStatus',
                },
            }).map(mapper),
        },
        {
            type: DSLEntityType.ENUM,
            name: 'TaskStatus',
            values: ['PENDING', 'DONE'],
        },
    ];
    return (
        <div style={{ padding: '25px', width: '750px', height: '100%' }}>
            <APIToClientMapper
                title={'My Connection'}
                source={RESTApiResource}
                target={RESTClientResource}
                onDataChanged={(change) => console.log('Data changed', change)}
                sourceEntities={apiEntities}
                targetEntities={clientEntities}
            />
        </div>
    );
};

export const NestedTypeDiff = () => {
    const apiEntities: DSLEntity[] = [
        {
            type: DSLEntityType.DATATYPE,
            name: 'Task',
            properties: Object.entries({
                id: {
                    type: 'string',
                },
                description: {
                    type: 'string',
                },
                state: {
                    ref: 'TaskState',
                },
            }).map(mapper),
        },
        {
            type: DSLEntityType.ENUM,
            name: 'TaskState',
            values: ['PENDING', 'DONE'],
        },
    ];
    const clientEntities = [
        {
            type: DSLEntityType.DATATYPE,
            name: 'Task',
            properties: Object.entries({
                id: {
                    type: 'string',
                },
                description: {
                    type: 'string',
                },
                state: {
                    ref: 'TaskState',
                },
            }).map(mapper),
        },
        {
            type: DSLEntityType.ENUM,
            name: 'TaskState',
            values: ['NoComment'],
        },
    ];
    return (
        <div style={{ padding: '25px', width: '750px', height: '100%' }}>
            <APIToClientMapper
                title={'My Connection'}
                source={RESTApiResource}
                target={RESTClientResource}
                onDataChanged={(change) => console.log('Data changed', change)}
                sourceEntities={apiEntities}
                targetEntities={clientEntities}
            />
        </div>
    );
};
