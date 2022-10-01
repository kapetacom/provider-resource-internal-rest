import {observer} from "mobx-react";
import React, {Component} from "react";
import {action, makeObservable, observable, toJS} from "mobx";
import _ from "lodash";

import {DSL_LANGUAGE_ID, DSLConverters, DSLMethod, MethodEditor, SingleLineInput} from "@blockware/ui-web-components";
import type {ResourceConfigProps} from "@blockware/ui-web-types";

import type {RESTResourceMetadata, RESTResourceSpec} from "./types";

import './RESTEditorComponent.less';

function validateApiName(fieldName: string, name: string) {
    if (!name) {
        return;
    }

    if (!/^[a-z]([a-z0-9_-]*[a-z0-9_])?$/i.test(name)) {
        throw new Error('Invalid API name');
    }
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
            methods: {}
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
                                      value={{code: this.spec.source?.value || '', entities: DSLConverters.fromSchemaMethods(this.spec.methods)}}
                                      onChange={(result) => {
                                          this.setResult(result.code, result.entities as DSLMethod[]);
                                      }}/>
                    </div>

                </div>
            </>
        )
    }

    @action
    private setResult(code: string, methods: DSLMethod[]) {
        this.spec.methods = DSLConverters.toSchemaMethods(methods);
        this.spec.source = {type: DSL_LANGUAGE_ID, value: code};
        this.triggerChange();
    }
}