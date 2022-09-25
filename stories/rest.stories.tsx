import React from 'react';
import {
  BlockWrapper,
  ConnectionMethodMappingType,
  ConnectionMethodsMapping,
  HTTPMethod,
  ResourceKind,
  Traffic
} from '@blockware/ui-web-types';

import RESTEditorComponent from "../src/web/RESTEditorComponent";
import {convertToEditMethod, RESTMethod, RESTResourceMetadata, RESTResourceSpec} from "../src/web/types";
import RestMethodView from "../src/web/RestMethodView";
import APIToClientMapper from "../src/web/mapping/APIToClientMapper";
import InspectConnectionContent from "../src/web/inspectors/InspectConnectionContent";

import '@blockware/ui-web-components/styles/index.less';

const API_KIND = 'rest.blockware.com/v1/API';
const CLIENT_KIND = 'rest.blockware.com/v1/Client';

const method:RESTMethod = {
  path:'/some/where',
  method: HTTPMethod.POST,
  description: 'My rest method',
  arguments: {
    id: {
      transport: 'PATH',
      type: 'string'
    }
  }
};

const method2:RESTMethod = {
  path:'itasks/{userId}/{id}',
  method: HTTPMethod.POST,
  description: 'My other method',
  arguments: {
    id: {
      transport: 'PATH',
      type: 'string'
    },
    name: {
      transport: 'QUERY',
      type: 'string'
    }
  }
};

const RESTApiResource:ResourceKind<RESTResourceSpec, RESTResourceMetadata> = {
  kind: API_KIND,
  metadata: {
    name: 'MyRESTAPI'
  },
  spec: {
    methods: {
      test: method,
      addTask: method2
    }
  }
};

const RESTClientResource:ResourceKind<RESTResourceSpec, RESTResourceMetadata> = {
  kind: CLIENT_KIND,
  metadata: {
    name: 'MyRESTClient'
  },
  spec: {
    methods: {
      otherTest: method2
    }
  }
};

const block:BlockWrapper<any> = {
  addEntity: entity => {

  },
  getData: () => {
    return {};
  },
  setData: () => {

  },
  getEntityNames: () => ['entity1', 'entity2']
};

const mapping:ConnectionMethodsMapping = {
   test: {
     targetId: 'remoteTest',
     type: ConnectionMethodMappingType.EXACT
   },
  otherTest: {
    targetId: 'remoteOtherTest',
    type: ConnectionMethodMappingType.EXACT
  }
};

const trafficLines:Traffic[] = [
  {
    ended: new Date().getTime(),
    connectionId:'1',
    consumerMethodId: 'remoteTest',
    created: new Date().getTime(),
    id:'1',
    providerMethodId:'test',
    error:'',
    request: {
      headers: {},
      body:'',
      url:'/some/where',
      method: 'POST'
    },
    response: {
      code: 200,
      headers: {}
    }
  },
  {
    ended: new Date().getTime(),
    connectionId:'1',
    consumerMethodId: 'remoteTest',
    created: new Date().getTime(),
    id:'2',
    providerMethodId:'test',
    error:'',
    request: {
      headers: {},
      body:'',
      url:'/some/where',
      method: 'POST'
    },
    response: {
      code: 200,
      headers: {}
    }
  },
  {
    ended: new Date().getTime(),
    connectionId:'1',
    consumerMethodId: 'remoteTest',
    created: new Date().getTime(),
    id:'3',
    providerMethodId:'test',
    error:'',
    request: {
      headers: {},
      body:'',
      url:'/some/where',
      method: 'POST'
    },
    response: {
      code: 503,
      headers: {}
    }
  },
  {
    ended: new Date().getTime(),
    connectionId:'1',
    consumerMethodId: 'remoteOtherTest',
    created: new Date().getTime(),
    id:'4',
    providerMethodId:'otherTest',
    error:'',
    request: {
      headers: {},
      body:'',
      url:'/some/where',
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

export const Editor = () =>  <div style={{padding:'10px',width:'850px', backgroundColor:'white', border:'1px solid gray'}}>
      <RESTEditorComponent {...RESTApiResource} block={block} />
    </div>;

export const MethodView = () => <RestMethodView compact={false} method={convertToEditMethod('test', method)} />;

export const MethodViewCompact = () => <RestMethodView compact={true} method={convertToEditMethod('test', method)} />;

export const APIToClientMapperView = () => <div style={{padding:'25px',width:'450px'}}>
  <APIToClientMapper name={'My Connection'}
                     source={RESTApiResource}
                     target={RESTClientResource}
                     sourceEntities={[]}
                     targetEntities={[]} />
</div>;


export const TrafficInspectorView = () => <InspectConnectionContent mapping={mapping} trafficLines={trafficLines} />;
