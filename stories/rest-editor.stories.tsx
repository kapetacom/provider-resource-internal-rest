/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { BlockDefinition, EntityType } from '@kapeta/schemas';
import { RESTEditorComponent } from '../src/web/RESTEditorComponent';
import { RESTResource } from '../src/web/types';
import RestMethodView from '../src/web/RestMethodView';
import { FormContainer } from '@kapeta/ui-web-components';
import { DSLControllerMethod } from '../src/web/mapping/types';
import { DSLConverters, DSLEntityType, KaplangWriter } from '@kapeta/kaplang-core';
import './stories.less';

const API_KIND = 'kapeta/resource-type-rest-api';

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

export default {
    title: 'REST Editor',
};

export const Editor = () => (
    <div
        style={{
            padding: '10px',
            width: '100%',
            boxSizing: 'border-box',
            height: '500px',
            backgroundColor: 'white',
            border: '1px solid gray',
        }}
    >
        <FormContainer initialValue={RESTApiResource} onChange={(data) => console.log('Data changed', data)}>
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
