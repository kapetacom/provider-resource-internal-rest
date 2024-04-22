/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { ConnectionMethodMappingType } from '@kapeta/ui-web-types';
import { RESTResource } from '../src/web/types';
import APIToClientMapper from '../src/web/mapping/APIToClientMapper';
import { ToastContainer } from '@kapeta/ui-web-components';
import { DSLControllerMethod } from '../src/web/mapping/types';
import { DSLConverters, DSLData, DSLDataTypeProperty, DSLEntityType, KaplangWriter } from '@kapeta/kaplang-core';
import './stories.less';

const API_KIND = 'kapeta/resource-type-rest-api';
const CLIENT_KIND = 'kapeta/resource-type-rest-client';

const mapper = ([name, property]: [string, any]): DSLDataTypeProperty => ({
    name,
    ...property,
});

const API_ENTITIES: DSLData[] = [
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
        type: DSLEntityType.DATATYPE,
        name: 'SimpleTask',
        properties: Object.entries({
            id: {
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

const CLIENT_ENTITIES: DSLData[] = [
    {
        type: DSLEntityType.DATATYPE,
        name: 'Task',
        properties: Object.entries({
            id: {
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

const getTaskMethod: DSLControllerMethod = {
    type: DSLEntityType.METHOD,
    name: 'getTaskMethod',
    annotations: [
        {
            type: '@GET',
            arguments: ['/tasks/{id}'],
        },
    ],
    description: 'Get a task by id',
    returnType: 'Task',
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
    ],
};

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

const addSimpleTaskMethod: DSLControllerMethod = {
    type: DSLEntityType.METHOD,
    name: 'addSimpleTaskMethod',
    annotations: [
        {
            type: '@POST',
            arguments: ['/tasks/{id}/simple'],
        },
    ],

    description: 'Adds a simple task to the system',
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
            type: 'SimpleTask',
        },
    ],
};

const deleteTaskMethod: DSLControllerMethod = {
    type: DSLEntityType.METHOD,
    name: 'deleteTaskMethod',
    annotations: [
        {
            type: '@DELETE',
            arguments: ['/tasks/{id}'],
        },
    ],
    returnType: 'void',
    description: 'Deletes a task from the system',
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
    ],
};

const RESTApiResourceEmpty: RESTResource = {
    kind: API_KIND,
    metadata: {
        name: 'MyEmptyAPU',
    },
    spec: {
        port: {
            type: 'rest',
        },
        methods: {},
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
        methods: DSLConverters.toSchemaMethods([getTaskMethod, addTaskMethod, addSimpleTaskMethod, deleteTaskMethod]),
        source: {
            type: 'kaplang',
            version: '1.0.0',
            value: KaplangWriter.write([getTaskMethod, addTaskMethod, addSimpleTaskMethod, deleteTaskMethod]),
        },
    },
};

const RESTApiResourceController: RESTResource = {
    kind: API_KIND,
    metadata: {
        name: 'MyRESTAPI',
    },
    spec: {
        port: {
            type: 'rest',
        },
        methods: DSLConverters.toSchemaMethods([
            {
                type: DSLEntityType.CONTROLLER,
                name: 'Tasks',
                methods: [getTaskMethod, addTaskMethod, addSimpleTaskMethod, deleteTaskMethod],
                path: '/tasks',
                namespace: 'Tasks',
            },
        ]),
        source: {
            type: 'kaplang',
            version: '1.0.0',
            value: KaplangWriter.write([
                {
                    type: DSLEntityType.CONTROLLER,
                    name: 'Tasks',
                    methods: [getTaskMethod, addTaskMethod, addSimpleTaskMethod, deleteTaskMethod],
                    path: '/tasks',
                    namespace: 'Tasks',
                },
            ]),
        },
    },
};

const RESTClientResource: RESTResource = {
    kind: CLIENT_KIND,
    metadata: {
        name: 'MyRESTClient',
    },
    spec: {
        port: {
            type: 'rest',
        },
        methods: DSLConverters.toSchemaMethods([addTaskMethod, deleteTaskMethod]),
        source: {
            type: 'kaplang',
            version: '1.0.0',
            value: KaplangWriter.write([addTaskMethod, deleteTaskMethod]),
        },
    },
};

const RESTClientResourceEmpty: RESTResource = {
    kind: CLIENT_KIND,
    metadata: {
        name: 'MyEmptyClient',
    },
    spec: {
        port: {
            type: 'rest',
        },
        methods: {},
    },
};

export default {
    title: 'REST API Mapper',
};

export const APIToClientMapperViewProblem = () => (
    <div style={{ padding: '25px', width: '750px', height: '100%' }}>
        <ToastContainer />
        <APIToClientMapper
            title={'My Connection'}
            source={RESTApiResource}
            target={RESTClientResource}
            onDataChanged={(change) => console.log('Data changed', change)}
            sourceEntities={API_ENTITIES}
            targetEntities={CLIENT_ENTITIES}
        />
    </div>
);

export const APIToClientMapperViewValueProblem = () => (
    <div style={{ padding: '25px', width: '750px', height: '100%' }}>
        <ToastContainer />
        <APIToClientMapper
            title={'My Connection'}
            source={RESTApiResource}
            target={RESTClientResource}
            value={{
                test: {
                    targetId: 'notRealTarget',
                    type: ConnectionMethodMappingType.EXACT,
                },
                notRealSource: {
                    targetId: 'doDeleteTask',
                    type: ConnectionMethodMappingType.EXACT,
                },
                addTask: {
                    targetId: 'doAddTask',
                    type: ConnectionMethodMappingType.EXACT,
                },
            }}
            onDataChanged={(change) => console.log('Data changed', change)}
            sourceEntities={API_ENTITIES}
            targetEntities={CLIENT_ENTITIES}
        />
    </div>
);

export const APIToClientMapperViewOK = () => (
    <div style={{ padding: '25px', width: '750px', height: '100%' }}>
        <ToastContainer />
        <APIToClientMapper
            title={'My Connection'}
            source={RESTApiResource}
            target={RESTClientResource}
            onDataChanged={(change) => console.log('Data changed', change)}
            sourceEntities={API_ENTITIES}
            targetEntities={API_ENTITIES}
        />
    </div>
);

export const APIControllerToClientMapperViewOK = () => (
    <div style={{ padding: '25px', width: '750px', height: '100%' }}>
        <ToastContainer />
        <APIToClientMapper
            title={'My Connection'}
            source={RESTApiResourceController}
            target={RESTClientResource}
            onDataChanged={(change) => console.log('Data changed', change)}
            sourceEntities={API_ENTITIES}
            targetEntities={API_ENTITIES}
        />
    </div>
);

export const APIToClientMapperViewEmptyServerProblem = () => (
    <div style={{ padding: '25px', width: '750px', height: '100%' }}>
        <ToastContainer />
        <APIToClientMapper
            title={'My Connection'}
            source={RESTApiResourceEmpty}
            target={RESTClientResource}
            onDataChanged={(change) => console.log('Data changed', change)}
            sourceEntities={API_ENTITIES}
            targetEntities={CLIENT_ENTITIES}
        />
    </div>
);

export const APIToClientMapperViewEmptyServerOK = () => (
    <div style={{ padding: '25px', width: '750px', height: '100%' }}>
        <ToastContainer />
        <APIToClientMapper
            title={'My Connection'}
            source={RESTApiResourceEmpty}
            target={RESTClientResource}
            onDataChanged={(change) => console.log('Data changed', change)}
            sourceEntities={[]}
            targetEntities={CLIENT_ENTITIES}
        />
    </div>
);

export const APIToClientMapperViewEmptyClientProblem = () => (
    <div style={{ padding: '25px', width: '750px', height: '100%' }}>
        <ToastContainer />
        <APIToClientMapper
            title={'My Connection'}
            source={RESTApiResource}
            target={RESTClientResourceEmpty}
            onDataChanged={(change) => console.log('Data changed', change)}
            sourceEntities={API_ENTITIES}
            targetEntities={CLIENT_ENTITIES}
        />
    </div>
);

export const APIToClientMapperViewNullMethodsServerOK = () => (
    <div style={{ padding: '25px', width: '750px', height: '100%' }}>
        <ToastContainer />
        <APIToClientMapper
            title={'My Connection'}
            source={{
                ...RESTApiResource,
                spec: {
                    ...RESTApiResource.spec,
                    methods: undefined,
                },
            }}
            target={RESTClientResourceEmpty}
            onDataChanged={(change) => console.log('Data changed', change)}
            sourceEntities={API_ENTITIES}
            targetEntities={[]}
        />
    </div>
);

export const APIToClientMapperViewNullMethodsClientOK = () => (
    <div style={{ padding: '25px', width: '750px', height: '100%' }}>
        <ToastContainer />
        <APIToClientMapper
            title={'My Connection'}
            source={RESTApiResource}
            target={{
                ...RESTClientResource,
                spec: {
                    ...RESTClientResource.spec,
                    methods: undefined,
                },
            }}
            onDataChanged={(change) => console.log('Data changed', change)}
            sourceEntities={API_ENTITIES}
            targetEntities={[]}
        />
    </div>
);
