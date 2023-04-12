import React from 'react';
import {
    ConnectionMethodMappingType,
    ConnectionMethodsMapping,
    HTTPMethod,
    RESTMethod,
    Traffic
} from '@kapeta/ui-web-types';

import {Entity} from "@kapeta/schemas";

import {RESTEditorComponent} from "../src/web/RESTEditorComponent";
import {convertToEditMethod, RESTResource} from "../src/web/types";
import RestMethodView from "../src/web/RestMethodView";
import APIToClientMapper from "../src/web/mapping/APIToClientMapper";
import InspectConnectionContent from "../src/web/inspectors/InspectConnectionContent";

import '@kapeta/ui-web-components/styles/index.less';
import {FormContainer, ToastContainer} from "@kapeta/ui-web-components";

const API_KIND = 'kapeta/resource-type-rest-api';
const CLIENT_KIND = 'kapeta/resource-type-rest-client';

const block: BlockDefinition = {
    kind: 'kapeta/block-type-service',
    metadata: {
        name: 'kapeta/test',
    },
    spec: {
        target : {
            kind: '',
        },
        entities: {
            types: [
                {
                    type: EntityType.Dto,
                    name: 'Task',
                    properties: {
                        id: {
                            type: 'string'
                        },
                        description: {
                            type: 'string'
                        },
                        state: {
                            ref: 'TaskState'
                        }
                    }
                }
            ]
        }
    }
}

const API_ENTITIES: Entity[] = [
    {
        type: EntityType.Dto,
        name: 'Task',
        properties: {
            id: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            state: {
                ref: 'TaskState'
            }
        }
    },
    {
        type: EntityType.Dto,
        name: 'SimpleTask',
        properties: {
            id: {
                type: 'string'
            },
            state: {
                ref: 'TaskState'
            }
        }
    },
    {
        type: EntityType.Enum,
        name: 'TaskState',
        values: ['PENDING', 'DONE']
    }
];


const CLIENT_ENTITIES: Entity[] = [
    {
        type: EntityType.Dto,
        name: 'Task',
        properties: {
            id: {
                type: 'string'
            },
            state: {
                ref: 'TaskState'
            }
        }
    },
    {
        type: EntityType.Enum,
        name: 'TaskState',
        values: ['PENDING', 'DONE']
    }
];

const getTaskMethod: RESTMethod = {
    path: '/tasks/{id}',
    method: HTTPMethod.GET,
    description: 'Get a task by id',
    responseType: {ref: 'Task'},
    arguments: {
        id: {
            transport: 'PATH',
            type: 'string'
        }
    }
};

const addTaskMethod: RESTMethod = {
    path: '/tasks/{id}',
    method: HTTPMethod.POST,
    description: 'Adds a task to the system',
    arguments: {
        id: {
            transport: 'PATH',
            type: 'string'
        },
        task: {
            transport: 'BODY',
            ref: 'Task'
        }
    }
};

const addSimpleTaskMethod: RESTMethod = {
    path: '/tasks/{id}/simple',
    method: HTTPMethod.POST,
    description: 'Adds a simple task to the system',
    arguments: {
        id: {
            transport: 'PATH',
            type: 'string'
        },
        task: {
            transport: 'BODY',
            ref: 'SimpleTask'
        }
    }
};

const deleteTaskMethod: RESTMethod = {
    path: '/tasks/{id}',
    method: HTTPMethod.DELETE,
    responseType: {type:'void'},
    description: 'Deletes a task from the system',
    arguments: {
        id: {
            transport: 'PATH',
            type: 'string'
        }
    }
};

const RESTApiResourceEmpty: RESTResource = {
    kind: API_KIND,
    metadata: {
        name: 'MyEmptyAPU'
    },
    spec: {
        port: {
            type: 'rest'
        },
        methods: {}
    }
};

const RESTApiResource: RESTResource = {
    kind: API_KIND,
    metadata: {
        name: 'MyRESTAPI'
    },
    spec: {
        port: {
            type: 'rest'
        },
        methods: {
            test: getTaskMethod,
            addTask: addTaskMethod,
            addSimpleTask: addSimpleTaskMethod,
            deleteTask: deleteTaskMethod
        }
    }
};

const RESTClientResource: RESTResource = {
    kind: CLIENT_KIND,
    metadata: {
        name: 'MyRESTClient'
    },
    spec: {
        port: {
            type: 'rest'
        },
        methods: {
            doAddTask: addTaskMethod,
            doDeleteTask: deleteTaskMethod
        }
    }
};

const RESTClientResourceEmpty: RESTResource = {
    kind: CLIENT_KIND,
    metadata: {
        name: 'MyEmptyClient'
    },
    spec: {
        port: {
            type: 'rest'
        },
        methods: {
        }
    }
};


const mapping: ConnectionMethodsMapping = {
    test: {
        targetId: 'remoteTest',
        type: ConnectionMethodMappingType.EXACT
    },
    otherTest: {
        targetId: 'remoteOtherTest',
        type: ConnectionMethodMappingType.EXACT
    }
};

const trafficLines: Traffic[] = [
    {
        ended: new Date().getTime(),
        connectionId: '1',
        consumerMethodId: 'remoteTest',
        created: new Date().getTime(),
        id: '1',
        providerMethodId: 'test',
        error: '',
        request: {
            headers: {},
            body: '',
            url: '/some/where',
            method: 'POST'
        },
        response: {
            code: 200,
            headers: {}
        }
    },
    {
        ended: new Date().getTime(),
        connectionId: '1',
        consumerMethodId: 'remoteTest',
        created: new Date().getTime(),
        id: '2',
        providerMethodId: 'test',
        error: '',
        request: {
            headers: {},
            body: '',
            url: '/some/where',
            method: 'POST'
        },
        response: {
            code: 200,
            headers: {}
        }
    },
    {
        ended: new Date().getTime(),
        connectionId: '1',
        consumerMethodId: 'remoteTest',
        created: new Date().getTime(),
        id: '3',
        providerMethodId: 'test',
        error: '',
        request: {
            headers: {},
            body: '',
            url: '/some/where',
            method: 'POST'
        },
        response: {
            code: 503,
            headers: {}
        }
    },
    {
        ended: new Date().getTime(),
        connectionId: '1',
        consumerMethodId: 'remoteOtherTest',
        created: new Date().getTime(),
        id: '4',
        providerMethodId: 'otherTest',
        error: '',
        request: {
            headers: {},
            body: '',
            url: '/some/where',
            method: 'POST'
        },
        response: {
            code: 200,
            headers: {}
        }
    }
];

import './stories.less';
import {BlockDefinition, EntityType} from "@kapeta/schemas/dist/cjs";

export default {
    title: 'REST'
};

export const Editor = () => <div
    style={{padding: '10px', width: '850px', height: '100%', backgroundColor: 'white', border: '1px solid gray'}}>
    <FormContainer initialValue={RESTApiResource}
                   onChange={data => console.log('Data changed', data)} >
        <RESTEditorComponent block={block} />
    </FormContainer>
</div>;

export const MethodView = () => <RestMethodView compact={false} method={convertToEditMethod('test', getTaskMethod)}/>;

export const MethodViewCompact = () => <RestMethodView compact={true}
                                                       method={convertToEditMethod('test', getTaskMethod)}/>;

export const APIToClientMapperViewProblem = () =>
    <div style={{padding: '25px', width: '750px', height: '100%',}}>
        <ToastContainer/>
        <APIToClientMapper title={'My Connection'}
                           source={RESTApiResource}
                           target={RESTClientResource}
                           onDataChanged={(change) => console.log('Data changed', change)}
                           sourceEntities={API_ENTITIES}
                           targetEntities={CLIENT_ENTITIES}/>
    </div>

export const APIToClientMapperViewValueProblem = () =>
    <div style={{padding: '25px', width: '750px', height: '100%',}}>
        <ToastContainer/>
        <APIToClientMapper title={'My Connection'}
                           source={RESTApiResource}
                           target={RESTClientResource}
                           value={{
                               test: {
                                   targetId: 'notRealTarget',
                                   type: ConnectionMethodMappingType.EXACT
                               },
                               notRealSource: {
                                   targetId: 'doDeleteTask',
                                   type: ConnectionMethodMappingType.EXACT
                               },
                               addTask: {
                                   targetId: 'doAddTask',
                                   type: ConnectionMethodMappingType.EXACT
                               }
                           }}
                           onDataChanged={(change) => console.log('Data changed', change)}
                           sourceEntities={API_ENTITIES}
                           targetEntities={CLIENT_ENTITIES}/>
    </div>

export const APIToClientMapperViewOK = () =>
    <div style={{padding: '25px', width: '750px', height: '100%',}}>
        <ToastContainer/>
        <APIToClientMapper title={'My Connection'}
                           source={RESTApiResource}
                           target={RESTClientResource}
                           onDataChanged={(change) => console.log('Data changed', change)}
                           sourceEntities={API_ENTITIES}
                           targetEntities={API_ENTITIES}/>
    </div>

export const APIToClientMapperViewEmptyServerProblem = () =>
    <div style={{padding: '25px', width: '750px', height: '100%',}}>
        <ToastContainer/>
        <APIToClientMapper title={'My Connection'}
                           source={RESTApiResourceEmpty}
                           target={RESTClientResource}
                           onDataChanged={(change) => console.log('Data changed', change)}
                           sourceEntities={API_ENTITIES}
                           targetEntities={CLIENT_ENTITIES}/>
    </div>

export const APIToClientMapperViewEmptyServerOK = () =>
    <div style={{padding: '25px', width: '750px', height: '100%',}}>
        <ToastContainer/>
        <APIToClientMapper title={'My Connection'}
                           source={RESTApiResourceEmpty}
                           target={RESTClientResource}
                           onDataChanged={(change) => console.log('Data changed', change)}
                           sourceEntities={[]}
                           targetEntities={CLIENT_ENTITIES}/>
    </div>

export const APIToClientMapperViewEmptyClientProblem = () =>
    <div style={{padding: '25px', width: '750px', height: '100%',}}>
        <ToastContainer/>
        <APIToClientMapper title={'My Connection'}
                           source={RESTApiResource}
                           target={RESTClientResourceEmpty}
                           onDataChanged={(change) => console.log('Data changed', change)}
                           sourceEntities={API_ENTITIES}
                           targetEntities={CLIENT_ENTITIES}/>
    </div>

export const APIToClientMapperViewEmptyClientOK = () =>
    <div style={{padding: '25px', width: '750px', height: '100%',}}>
        <ToastContainer/>
        <APIToClientMapper title={'My Connection'}
                           source={RESTApiResource}
                           target={RESTClientResourceEmpty}
                           onDataChanged={(change) => console.log('Data changed', change)}
                           sourceEntities={API_ENTITIES}
                           targetEntities={[]}/>
    </div>


export const TrafficInspectorView = () => <InspectConnectionContent mapping={mapping} trafficLines={trafficLines}/>;
