import React from 'react';
import {
    BlockWrapper,
    ConnectionMethodMappingType,
    ConnectionMethodsMapping,
    HTTPMethod,
    ResourceKind,
    RESTMethod,
    SchemaEntity,
    SchemaEntityType,
    Traffic
} from '@blockware/ui-web-types';

import RESTEditorComponent from "../src/web/RESTEditorComponent";
import {convertToEditMethod, RESTResourceMetadata, RESTResourceSpec} from "../src/web/types";
import RestMethodView from "../src/web/RestMethodView";
import APIToClientMapper from "../src/web/mapping/APIToClientMapper";
import InspectConnectionContent from "../src/web/inspectors/InspectConnectionContent";

import '@blockware/ui-web-components/styles/index.less';
import {ToastContainer} from "@blockware/ui-web-components";

const API_KIND = 'rest.blockware.com/v1/API';
const CLIENT_KIND = 'rest.blockware.com/v1/Client';

const API_ENTITIES: SchemaEntity[] = [
    {
        type: SchemaEntityType.DTO,
        name: 'Task',
        properties: {
            id: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            state: {
                type: {$ref: 'TaskState'}
            }
        }
    },
    {
        type: SchemaEntityType.DTO,
        name: 'SimpleTask',
        properties: {
            id: {
                type: 'string'
            },
            state: {
                type: {$ref: 'TaskState'}
            }
        }
    },
    {
        type: SchemaEntityType.ENUM,
        name: 'TaskState',
        values: ['PENDING', 'DONE']
    }
];


const CLIENT_ENTITIES: SchemaEntity[] = [
    {
        type: SchemaEntityType.DTO,
        name: 'Task',
        properties: {
            id: {
                type: 'string'
            },
            state: {
                type: {$ref: 'TaskState'}
            }
        }
    },
    {
        type: SchemaEntityType.ENUM,
        name: 'TaskState',
        values: ['PENDING', 'DONE']
    }
];

const getTaskMethod: RESTMethod = {
    path: '/tasks/{id}',
    method: HTTPMethod.GET,
    description: 'Get a task by id',
    responseType: {$ref: 'Task'},
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
            type: {$ref: 'Task'}
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
            type: {$ref: 'SimpleTask'}
        }
    }
};

const deleteTaskMethod: RESTMethod = {
    path: '/tasks/{id}',
    method: HTTPMethod.DELETE,
    responseType: 'void',
    description: 'Deletes a task from the system',
    arguments: {
        id: {
            transport: 'PATH',
            type: 'string'
        }
    }
};

const RESTApiResourceEmpty: ResourceKind<RESTResourceSpec, RESTResourceMetadata> = {
    kind: API_KIND,
    metadata: {
        name: 'MyEmptyAPU'
    },
    spec: {
        methods: {}
    }
};

const RESTApiResource: ResourceKind<RESTResourceSpec, RESTResourceMetadata> = {
    kind: API_KIND,
    metadata: {
        name: 'MyRESTAPI'
    },
    spec: {
        methods: {
            test: getTaskMethod,
            addTask: addTaskMethod,
            addSimpleTask: addSimpleTaskMethod,
            deleteTask: deleteTaskMethod
        }
    }
};

const RESTClientResource: ResourceKind<RESTResourceSpec, RESTResourceMetadata> = {
    kind: CLIENT_KIND,
    metadata: {
        name: 'MyRESTClient'
    },
    spec: {
        methods: {
            doAddTask: addTaskMethod,
            doDeleteTask: deleteTaskMethod
        }
    }
};

const RESTClientResourceEmpty: ResourceKind<RESTResourceSpec, RESTResourceMetadata> = {
    kind: CLIENT_KIND,
    metadata: {
        name: 'MyEmptyClient'
    },
    spec: {
        methods: {
        }
    }
};

const block: BlockWrapper<any> = {
    id: 'some-block',
    addEntity: entity => {

    },
    getData: () => {
        return {};
    },
    setData: () => {

    },
    getEntityNames: () => ['Task', 'TestType']
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

export default {
    title: 'REST'
};

export const Editor = () => <div
    style={{padding: '10px', width: '850px', height: '100%', backgroundColor: 'white', border: '1px solid gray'}}>
    <RESTEditorComponent {...RESTApiResource} block={block} onDataChanged={(metadata, spec) => {
        console.log('Data changed', metadata, spec);
    }}/>
</div>;

export const MethodView = () => <RestMethodView compact={false} method={convertToEditMethod('test', getTaskMethod)}/>;

export const MethodViewCompact = () => <RestMethodView compact={true}
                                                       method={convertToEditMethod('test', getTaskMethod)}/>;

export const APIToClientMapperViewProblem = () =>
    <div style={{padding: '25px', width: '750px', height: '100%',}}>
        <ToastContainer/>
        <APIToClientMapper name={'My Connection'}
                           source={RESTApiResource}
                           target={RESTClientResource}
                           onDataChanged={(change) => console.log('Data changed', change)}
                           sourceEntities={API_ENTITIES}
                           targetEntities={CLIENT_ENTITIES}/>
    </div>

export const APIToClientMapperViewValueProblem = () =>
    <div style={{padding: '25px', width: '750px', height: '100%',}}>
        <ToastContainer/>
        <APIToClientMapper name={'My Connection'}
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
        <APIToClientMapper name={'My Connection'}
                           source={RESTApiResource}
                           target={RESTClientResource}
                           onDataChanged={(change) => console.log('Data changed', change)}
                           sourceEntities={API_ENTITIES}
                           targetEntities={API_ENTITIES}/>
    </div>

export const APIToClientMapperViewEmptyServerProblem = () =>
    <div style={{padding: '25px', width: '750px', height: '100%',}}>
        <ToastContainer/>
        <APIToClientMapper name={'My Connection'}
                           source={RESTApiResourceEmpty}
                           target={RESTClientResource}
                           onDataChanged={(change) => console.log('Data changed', change)}
                           sourceEntities={API_ENTITIES}
                           targetEntities={CLIENT_ENTITIES}/>
    </div>

export const APIToClientMapperViewEmptyServerOK = () =>
    <div style={{padding: '25px', width: '750px', height: '100%',}}>
        <ToastContainer/>
        <APIToClientMapper name={'My Connection'}
                           source={RESTApiResourceEmpty}
                           target={RESTClientResource}
                           onDataChanged={(change) => console.log('Data changed', change)}
                           sourceEntities={[]}
                           targetEntities={CLIENT_ENTITIES}/>
    </div>

export const APIToClientMapperViewEmptyClientProblem = () =>
    <div style={{padding: '25px', width: '750px', height: '100%',}}>
        <ToastContainer/>
        <APIToClientMapper name={'My Connection'}
                           source={RESTApiResource}
                           target={RESTClientResourceEmpty}
                           onDataChanged={(change) => console.log('Data changed', change)}
                           sourceEntities={API_ENTITIES}
                           targetEntities={CLIENT_ENTITIES}/>
    </div>

export const APIToClientMapperViewEmptyClientOK = () =>
    <div style={{padding: '25px', width: '750px', height: '100%',}}>
        <ToastContainer/>
        <APIToClientMapper name={'My Connection'}
                           source={RESTApiResource}
                           target={RESTClientResourceEmpty}
                           onDataChanged={(change) => console.log('Data changed', change)}
                           sourceEntities={API_ENTITIES}
                           targetEntities={[]}/>
    </div>


export const TrafficInspectorView = () => <InspectConnectionContent mapping={mapping} trafficLines={trafficLines}/>;
