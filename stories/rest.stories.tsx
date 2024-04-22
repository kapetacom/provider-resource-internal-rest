/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { ConnectionMethodMappingType, ConnectionMethodsMapping, Traffic } from '@kapeta/ui-web-types';

import { BlockDefinition, EntityType } from '@kapeta/schemas';

import { RESTEditorComponent } from '../src/web/RESTEditorComponent';
import { RESTResource } from '../src/web/types';
import RestMethodView from '../src/web/RestMethodView';
import APIToClientMapper from '../src/web/mapping/APIToClientMapper';
import { InspectConnectionContent } from '../src/web/inspectors/InspectConnectionContent';
import { FormContainer, ToastContainer } from '@kapeta/ui-web-components';
import './stories.less';
import { DSLControllerMethod } from '../src/web/mapping/types';
import { DSLConverters, DSLData, DSLDataTypeProperty, DSLEntityType, KaplangWriter } from '@kapeta/kaplang-core';

const API_KIND = 'kapeta/resource-type-rest-api';
const CLIENT_KIND = 'kapeta/resource-type-rest-client';
const mapper = ([name, property]: [string, any]): DSLDataTypeProperty => ({
    name,
    ...property,
});

const block: BlockDefinition = {
    kind: 'kapeta/block-type-service',
    metadata: {
        name: 'kapeta/test',
    },
    spec: {
        target: {
            kind: '',
        },
        entities: {
            types: [
                {
                    type: EntityType.Dto,
                    name: 'Task',
                    properties: {
                        id: {
                            type: 'string',
                        },
                        description: {
                            type: 'string',
                        },
                        state: {
                            ref: 'TaskState',
                        },
                    },
                },
            ],
        },
    },
};

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

const mapping: ConnectionMethodsMapping = {
    addMessage: {
        targetId: 'remoteAddMessage',
        type: ConnectionMethodMappingType.EXACT,
    },
    getUsers: {
        targetId: 'remoteGetUsers',
        type: ConnectionMethodMappingType.EXACT,
    },
};

const now = new Date().getTime();

const trafficLines: Traffic[] = [
    {
        ended: now,
        connectionId: '1',
        consumerMethodId: 'remoteAddMessage',
        created: now - 123,
        id: '1',
        providerMethodId: 'addMessage',
        error: '',
        request: {
            headers: {
                'content-type': 'application/json',
                'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
                accept: 'application/json',
                dnt: '1',
                'sec-ch-ua-mobile': '?0',
                'user-agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                referer: 'http://127.0.0.1:40024/',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-GB,en;q=0.9',
                'if-none-match': 'W/"a0-tByXetiJPiPI3/BxjLTmmTCZyW4"',
                'accept-charset': 'utf-8',
                'sentry-trace': 'a9a976d7976846e6a5bfeb15168fc9b0-91c32ebfa69e524f-0',
                baggage:
                    'sentry-environment=production,sentry-public_key=0b7cc946d82c591473d6f95fff5e210b,sentry-trace_id=a9a976d7976846e6a5bfeb15168fc9b0,sentry-sample_rate=0.05,sentry-transaction=GET%20%2Fproxy%2Fkapeta%253A%252F%252Fharald_andertun%252Fgreen-mango%253Alocal%2F40c4e346-633f-4618-bf6c-c4b794815ed1%2Fmain%2Fweb%2Fapi%2Frest%2Fmangos%2Fmangos,sentry-sampled=false',
            },
            body: `{"author": "johndoe", "content": "Hello World", "sentAt": ${now}}`,
            url: '/messages',
            method: 'POST',
        },
        response: {
            code: 200,
            headers: {
                'x-powered-by': 'Express',
                'content-type': 'application/json; charset=utf-8',
                'content-length': '2315',
                etag: 'W/"a0-tByXetiJPiPI3/BxjLTmmTCZyW4"',
                date: 'Tue, 16 Apr 2024 10:09:25 GMT',
                connection: 'close',
            },
            body: `{ "id": "1234", "author": { "userId": "johndoe", "name": "John Doe", "email": "johndoe@example.com", "profilePicture": "https://example.com/path/to/image.jpg", "status": "online" }, "content": "Hello World", "metadata": { "contentType": "text/plain", "contentLength": 11, "tags": ["greeting", "introductory"], "language": "en" }, "status": { "delivered": true, "read": false, "archived": false }, "sentAt": "${now}" }`,
        },
    },
    {
        ended: now,
        connectionId: '1',
        consumerMethodId: 'remoteAddMessage',
        created: now - 2345,
        id: '2',
        providerMethodId: 'addMessage',
        error: '',
        request: {
            headers: {},
            body: '',
            url: '/some/where',
            method: 'POST',
        },
        response: {
            code: 200,
            headers: {},
        },
    },
    {
        ended: now,
        connectionId: '1',
        consumerMethodId: 'remoteAddMessage',
        created: now - 3456,
        id: '3',
        providerMethodId: 'addMessage',
        error: '',
        request: {
            headers: {},
            body: '',
            url: '/some/where',
            method: 'POST',
        },
        response: {
            code: 503,
            headers: {},
        },
    },
    {
        ended: now,
        connectionId: '1',
        consumerMethodId: 'remoteGetUsers',
        created: now - 4567,
        id: '4',
        providerMethodId: 'getUsers',
        error: '',
        request: {
            headers: {},
            body: '',
            url: '/some/where',
            method: 'POST',
        },
        response: {
            code: 200,
            headers: {
                'content-type': 'application/json',
            },
            body: '[{"id": "1234"}, {"id": "1235"}, {"id": "1236"}, {"id": "1237"}]',
        },
    },
];

export default {
    title: 'REST',
};

export const Editor = () => (
    <div
        style={{ padding: '10px', width: '850px', height: '500px', backgroundColor: 'white', border: '1px solid gray' }}
    >
        <FormContainer initialValue={RESTApiResource} onChange={(data: any) => console.log('Data changed', data)}>
            <RESTEditorComponent block={block} />
        </FormContainer>
    </div>
);

export const MethodView = () => <RestMethodView compact={false} method={getTaskMethod} />;

export const MethodViewController = () => (
    <RestMethodView
        compact={false}
        method={{
            ...getTaskMethod,
            namespace: 'Tasks',
        }}
    />
);

export const MethodViewCompact = () => <RestMethodView compact={true} method={getTaskMethod} />;

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

export const TrafficInspectorView = () => <InspectConnectionContent mapping={mapping} trafficLines={trafficLines} />;
