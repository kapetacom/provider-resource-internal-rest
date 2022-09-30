import {observer} from "mobx-react";
import React, {Component} from "react";
import {action, makeObservable, observable, toJS} from "mobx";
import _ from "lodash";

import {DSLEntityType, DSLMethod, MethodEditor, SingleLineInput} from "@blockware/ui-web-components";
import {HTTPMethod, HTTPTransport, ResourceConfigProps, SchemaEntryType} from "@blockware/ui-web-types";

import {RESTMethod, RESTResourceMetadata, RESTResourceSpec} from "./types";

import './RESTEditorComponent.less';

type SchemaMethods = { [p: string]: RESTMethod };

function validateApiName(fieldName: string, name: string) {
    if (!name) {
        return;
    }

    if (!/^[a-z]([a-z0-9_-]*[a-z0-9_])?$/i.test(name)) {
        throw new Error('Invalid API name');
    }
}

function fromSchemaType(type:any):string {
    if (!type) {
        return 'void'
    }
    return type && type.$ref ? type.$ref : type;
}

function toSchemaType(type:string):SchemaEntryType {
    if (!type) {
        return ''
    }

    if (type[0].toUpperCase() === type[0]) {
        return {$ref: type};
    }

    return type;
}

function fromSchemaTransport(transport:string) {
    switch (transport.toLowerCase()) {
        case 'path':
            return '@Path';
        case 'header':
            return '@Header';
        case 'query':
            return '@Query';
        case 'body':
            return '@Body';
    }

    return ''
}

function fromSchema(methods: SchemaMethods):DSLMethod[] {
    return Object.entries(methods).map(([name, method]) => {

        return {
            name,
            returnType: fromSchemaType(method.responseType),
            type: DSLEntityType.METHOD,
            description: method.description,
            parameters: method.arguments ? Object.entries(method.arguments).map(([name, arg]) => {
                return {
                    name,
                    type: fromSchemaType(arg.type),
                    annotations: arg.transport ? [
                        {
                            type: fromSchemaTransport(arg.transport)
                        }
                    ] : []
                }
            }) : [],
            annotations: [
                {
                    type: `@${method.method}`,
                    arguments: [ method.path ]
                }
            ]
        }
    });
}

function toSchema(methods:DSLMethod[]):SchemaMethods {
    const out:SchemaMethods = {}

    methods.forEach(method => {

        const args = {};
        method.parameters.forEach((arg) => {
            args[arg.name] = {
                type: toSchemaType(arg.type),
                transport: arg.annotations && arg.annotations.length > 0 ? arg.annotations[0].type : HTTPTransport.QUERY
            };
        })

        out[method.name] = {
            responseType: toSchemaType(method.returnType),
            method: (method.annotations ? method?.annotations[0].type?.substring(1).toUpperCase() : 'GET') as HTTPMethod,
            path: (method.annotations && method.annotations[0].arguments ? method?.annotations[0].arguments[0] : '/'),
            description: method.description || '',
            arguments: args
        }
    });

    return out;
}

@observer
export default class RESTEditorComponent extends Component<ResourceConfigProps<RESTResourceMetadata, RESTResourceSpec>, any> {

    @observable
    private readonly metadata: RESTResourceMetadata;

    @observable
    private readonly spec: RESTResourceSpec;

    constructor(props: ResourceConfigProps<RESTResourceMetadata, RESTResourceSpec>) {
        super(props);
        makeObservable(this);

        this.metadata = !_.isEmpty(this.props.metadata) ? _.cloneDeep(this.props.metadata) : {
            name: 'New'
        };

        this.spec = !_.isEmpty(this.props.spec) ? _.cloneDeep(this.props.spec) : {
            methods: {},
        };

    }


    private triggerChange() {

        const spec = toJS(this.spec);
        const metadata = toJS(this.metadata);

        this.props.onDataChanged(metadata, spec);
    }


    @action
    private handleMetaDataChanged(name: string, input: string) {
        this.metadata[name] = input.trim();

        this.triggerChange();
    }


    render() {

        return (
            <>
                <div className={"rest-resource-editor"}>

                    <SingleLineInput
                        name={"name"}
                        value={this.metadata.name}
                        label={"Name"}
                        validation={['required', validateApiName]}
                        help={"Name your REST API. E.g. MyApi"}
                        onChange={(name: string, input: string) => this.handleMetaDataChanged(name, input)}
                    />

                    <div className={'editor'}>
                        <MethodEditor restMethods={true}
                                      validTypes={this.props.block.getEntityNames()}
                                      value={{code: '', entities: fromSchema(this.spec.methods)}}
                                      onChange={(result) => {
                                          this.setResult(result.entities as DSLMethod[]);
                                      }}/>
                    </div>

                </div>
            </>
        )
    }

    @action
    private setResult(methods: DSLMethod[]) {
        const newMethods = toSchema(methods);
        if (!_.isEqual(newMethods, this.spec.methods)) {
            this.spec.methods = newMethods;
            this.triggerChange();
        }
    }
}