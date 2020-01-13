import { observer } from "mobx-react";
import React, { ChangeEvent, Component } from "react";
import { action, observable, toJS } from "mobx";
import _ from "lodash";

import {
    FormRow,
    EntityPicker,
    FormContainer,
    FormButtons
} from "@blockware/ui-web-components";
import {
    typeValue,
    HTTPMethod,
    HTTPTransport,
    ResourceConfigProps
} from "@blockware/ui-web-types";


import {
    convertToEditMethod, convertToRestMethod,
    RESTMethodArgumentEdit,
    RESTMethodEdit,
    RESTResourceMetadata,
    RESTResourceSpec
} from "./types";

import RestMethodView from "./RestMethodView";

import './RESTEditorComponent.less';

function validateApiName(fieldName: string, name: string) {
    if (!name) {
        return;
    }

    if (!/^[a-z]([a-z0-9_-]*[a-z0-9_])?$/i.test(name)) {
        throw new Error('Invalid API name');
    }
}

function validateArgumentName(fieldName: string, name: string) {
    if (!name) {
        return;
    }
    if (!/^[a-z]([a-z0-9_-]*[a-z0-9_])?$/i.test(name)) {
        throw new Error('Invalid argument name');
    }
}

function validateMethodName(fieldName: string, name: string) {
    if (!name) {
        return;
    }
    if (!/^[a-z]([a-z0-9_-]*[a-z0-9_])?$/i.test(name)) {
        throw new Error('Invalid method name');
    }
}

function validatePath(fieldName: string, name: string) {
    if (!name) {
        return;
    }
    if (!/^(\/[a-z{]([}a-z0-9_-]*))+\/?$/i.test(name)) {
        throw new Error('Invalid path');
    }
}

function asValue(evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    return evt.target.value.trim();
}

function createEmptyMethod(): RESTMethodEdit {
    return {
        id: '',
        description: '',
        method: HTTPMethod.GET,
        path: '',
        arguments: [],
        responseType: ''
    }
}

function createEmptyArgument(): RESTMethodArgumentEdit {
    return {
        id: '',
        type: "",
        transport: HTTPTransport.QUERY
    }
}


@observer
export default class RESTEditorComponent extends Component<ResourceConfigProps<RESTResourceMetadata, RESTResourceSpec>, any> {

    @observable
    private readonly metadata: RESTResourceMetadata;

    @observable
    private readonly spec: RESTResourceSpec;

    @observable
    private newMethod: RESTMethodEdit = createEmptyMethod();

    @observable
    private newArgument: RESTMethodArgumentEdit = createEmptyArgument();

    @observable
    private currentMethod?: RESTMethodEdit;

    @observable
    private currentMethodOriginal?: RESTMethodEdit;

    @observable
    private methods: RESTMethodEdit[] = [];

    @observable
    private showCreateForm = false;

    constructor(props: ResourceConfigProps<RESTResourceMetadata, RESTResourceSpec>) {
        super(props);

        this.metadata = !_.isEmpty(this.props.metadata) ? _.cloneDeep(this.props.metadata) : {
            name: 'New'
        };

        this.spec = !_.isEmpty(this.props.spec) ? _.cloneDeep(this.props.spec) : {
            methods: {},
        };

        this.readFromSpec();

        if (this.methods.length < 1) {
            this.showCreateForm = true;
        }
    }

    private readFromSpec() {
        _.forEach(toJS(this.spec.methods), (method, methodId) => {
            this.methods.push(convertToEditMethod(methodId, method));
        });
    }
    private resetNewMethod() {
        this.newMethod = createEmptyMethod();
    }

    private resetNewArgument() {
        this.newArgument = createEmptyArgument();
    }

    private triggerChange() {

        const spec = toJS(this.spec);
        const metadata = toJS(this.metadata);

        spec.methods = {};
        this.methods.forEach((method) => {
            spec.methods[method.id] = convertToRestMethod(method);
        });

        this.props.onDataChanged(metadata, spec);
    }

    @action
    private addMethod() {
        this.methods.push(this.newMethod);

        this.resetNewMethod();
        this.resetNewArgument();
        this.showCreateForm = false;
        this.triggerChange();
    }

    @action
    private addArgument(method: RESTMethodEdit) {

        if (method === this.currentMethod) {
            this.currentMethod.arguments.push(this.newArgument);
        }

        if (method === this.newMethod) {
            this.newMethod.arguments.push(this.newArgument);
        }

        this.resetNewArgument();
    }

    @action
    private handleMetaDataChanged(evt: ChangeEvent<HTMLInputElement>) {
        this.metadata[evt.target.name] = evt.target.value.trim();

        this.triggerChange();
    }

    @action
    private editMethod(method: RESTMethodEdit) {
        this.currentMethodOriginal = method;
        this.currentMethod = _.cloneDeep(method);
        this.showCreateForm = false;
    }

    @action
    private stopEditingMethod() {
        this.currentMethod = undefined;
        this.currentMethodOriginal = undefined;
        this.resetNewArgument();
    }

    @action
    private cancelEditingMethod() {
        this.stopEditingMethod();
    }

    @action
    saveMethod() {
        if (!this.currentMethod ||
            !this.currentMethodOriginal) {
            return;
        }

        const simpleMethod = toJS(this.currentMethod);
        _.forEach(simpleMethod, (value, field) => {
            // @ts-ignore
            this.currentMethodOriginal[field] = value;
        });

        this.stopEditingMethod();
        this.triggerChange();
    }

    @action
    deleteMethod(method: RESTMethodEdit) {
        const ix = this.methods.indexOf(method);
        if (ix < 0) {
            return;
        }
        this.methods.splice(ix, 1);
        this.triggerChange();
    }

    @action
    setMethodField(method: RESTMethodEdit, field: string, value: any) {
        if (method === this.currentMethod) {
            this.currentMethod[field] = value;
        }

        if (method === this.newMethod) {
            this.newMethod[field] = value;
        }
    }

    @action
    setArgumentField(method: RESTMethodEdit, arg: RESTMethodArgumentEdit, field: string, value: any) {
        if (arg === this.newArgument) {
            this.newArgument[field] = value;
            return;
        }

        if (method === this.currentMethod) {
            let ix = this.currentMethod.arguments.indexOf(arg);
            this.currentMethod.arguments[ix][field] = value;
        }

        if (method === this.newMethod) {
            let ix = this.newMethod.arguments.indexOf(arg);
            this.newMethod.arguments[ix][field] = value;
        }
    }

    @action
    deleteArgument(method: RESTMethodEdit, arg: RESTMethodArgumentEdit) {

        if (arg === this.newArgument) {
            return;
        }

        if (method === this.currentMethod) {
            let ix = this.currentMethod.arguments.indexOf(arg);
            this.currentMethod.arguments.splice(ix, 1);
        }

        if (method === this.newMethod) {
            let ix = this.newMethod.arguments.indexOf(arg);
            this.newMethod.arguments.splice(ix, 1);
        }
    }

    @action
    toggleCreateForm() {
        this.showCreateForm = !this.showCreateForm;
    }

    isEditingMethod(method: RESTMethodEdit) {
        return this.currentMethodOriginal === method;
    }

    isEditingMode() {
        return !!this.currentMethodOriginal;
    }

    renderArgumentForm(method: RESTMethodEdit, argument: RESTMethodArgumentEdit, key: string, ix: number) {
        return (
            <>
                <div className={"form-horizontal-rows"}>
                    <FormRow label={'Name'}
                        validation={['required', validateArgumentName]} >
                        <input type="text" placeholder="E.g. myId"
                            name={key + '_method.argument.' + ix + '.id'}
                            autoComplete={"off"}
                            value={argument.id}
                            onChange={(evt) => {
                                this.setArgumentField(method, argument, 'id', asValue(evt));
                            }} />
                    </FormRow>

                    <FormRow label={'Type'}
                        validation={['required']}
                    >
                        {/* <input type="text" placeholder="E.g. string or User"
                               name={key + '_method.argument.' + ix + '.type'}
                               autoComplete={"off"}
                               value={typeName(argument.type)}
                               onChange={(evt) => {
                                   this.setArgumentField(method, argument, 'type', asValue(evt));
                               }}/> */}
                        <EntityPicker name={key + '_method.argument.' + ix + '.type'}
                            value={typeValue(argument.type)}
                            entities={this.props.block.getEntityNames()}
                            onEntityCreated={(newEntity) => this.props.block.addEntity(newEntity)}
                            onChange={(value: any) => {
                                console.log(value);
                                this.setArgumentField(method, argument, 'type', value);

                            }} />
                    </FormRow>

                    <FormRow label={'Transport'}
                        validation={['required']}>
                        <select name={key + '_method.argument.' + ix + '.transport'}
                            value={argument.transport ? argument.transport.toUpperCase() : HTTPTransport.QUERY}
                            onChange={(evt) => {
                                this.setArgumentField(method, argument, 'transport', HTTPTransport[asValue(evt)]);
                            }}>

                            {
                                Object.keys(HTTPTransport).map((methodName) => {
                                    return (
                                        <option key={methodName}>{methodName}</option>
                                    )
                                })
                            }

                        </select>
                    </FormRow>
                </div>
            </>
        )
    }

    renderMethodForm(method: RESTMethodEdit, key: string) {


        return (
            <>
                <FormRow label={"Method name"}
                    validation={['required', validateMethodName]}
                    help="Name the method name - this will be used when generating code">

                    <input type="text" placeholder="E.g. getSomething"
                        name={key + '_method.id'}
                        autoComplete={"off"}
                        value={method.id}
                        onChange={(evt) => {
                            this.setMethodField(method, 'id', asValue(evt));
                        }} />
                </FormRow>

                <FormRow label={"Description"}
                    help="Describe your method so others understand what it does">
                    <textarea
                        placeholder="E.g. Gets something from somewhere"
                        name={key + '_method.description'}
                        value={method.description}
                        onChange={(evt) => {
                            this.setMethodField(method, 'description', evt.target.value);
                        }} />
                </FormRow>

                <div className={'rest-method-path form-horizontal-rows'}>
                    <FormRow label={"HTTP Method"}
                        validation={['required']}
                        className={"rest-http-method"}
                        help="Choose your HTTP method">
                        <select name={key + '_method.method'}
                            value={method.method}
                            onChange={(evt) => {
                                this.setMethodField(method, 'method', HTTPMethod[asValue(evt)]);
                            }}>

                            {
                                Object.keys(HTTPMethod).map((methodName) => {
                                    return (
                                        <option key={methodName}>{methodName}</option>
                                    )
                                })
                            }

                        </select>
                    </FormRow>

                    <FormRow label={"Path"}
                        className={"rest-http-path"}
                        validation={['required', validatePath]}
                        help="Write your path name. Path variables are denoted with { and } - e.g. /my/{id}">

                        <input type="text" placeholder="E.g. /something/{id}"
                            name={key + '_method.path'}
                            autoComplete={"off"}
                            value={method.path}
                            onChange={(evt) => {
                                this.setMethodField(method, 'path', asValue(evt));
                            }} />
                    </FormRow>
                </div>

                <FormRow label={"Response type"}
                    validation={['required']}
                    help="Choose your response type - this is the methods return type.">

                    <EntityPicker name={key + '_method.responseType'}
                        value={typeValue(method.responseType)}
                        entities={this.props.block.getEntityNames()}
                        onEntityCreated={(newEntity) => this.props.block.addEntity(newEntity)}
                        allowVoid={true}
                        onChange={(value: any) => {
                            this.setMethodField(method, 'responseType', value);
                        }} />
                </FormRow>

                <div className={'form-section arguments'}>
                    <h4>Arguments</h4>

                    <ul className={"method-arguments"}>
                        {
                            method.arguments.map((argument, ix) => {
                                return (
                                    <li key={ix} className={"method-argument"}>

                                        <div className={"actions"}>
                                            <button className={'form-button'}
                                                type={'button'}
                                                onClick={() => this.deleteArgument(method, argument)}>Delete</button>
                                        </div>

                                        {this.renderArgumentForm(method, argument, key, ix)}

                                    </li>
                                )
                            })
                        }

                        <li className={"method-argument new"}>

                            <FormContainer onSubmit={() => this.addArgument(method)}>

                                {this.renderArgumentForm(method, this.newArgument, key, -1)}

                                <FormButtons>
                                    <button type={"submit"} >
                                        <i className={"fa fa-plus"} />
                                        <span>Add argument</span>
                                    </button>
                                </FormButtons>

                            </FormContainer>
                        </li>

                    </ul>
                </div>
            </>
        )
    }

    renderMethodView(method: RESTMethodEdit, key: string, editing: boolean) {
        return <>
            <div className={"rest-method " + (editing ? 'editing' : 'viewing')}>
                {!editing &&
                    <>
                        <div className={"actions form-buttons"}>
                            <button type={'button'}
                                onClick={() => this.editMethod(method)}>Edit</button>

                            {!this.isEditingMode() &&
                                <button type={'button'}
                                    onClick={() => this.deleteMethod(method)}>Delete</button>
                            }

                        </div>
                        <RestMethodView method={method} />
                    </>
                }
                {editing && this.currentMethod &&
                    <>
                        <FormContainer onSubmit={() => this.saveMethod()}>

                            {this.renderMethodForm(this.currentMethod, key)}

                            <FormButtons>
                                <button type={'submit'}>Save</button>
                                <button type={'button'}
                                    onClick={() => this.cancelEditingMethod()}>Cancel</button>
                            </FormButtons>
                        </FormContainer>
                    </>

                }
            </div>
        </>
    }

    render() {

        return (
            <>
                <div className={"rest-resource-editor"}>
                    <FormRow label="Name"
                        help="Name your REST API"
                        validation={['required', validateApiName]}>

                        <input type="text" placeholder="E.g. MyApi"
                            name="name"
                            autoComplete={"off"}
                            value={this.metadata.name}
                            onChange={(evt) => {
                                this.handleMetaDataChanged(evt)
                            }} />

                    </FormRow>

                    <div className={"methods-container"}>
                        <ul className={"methods"}>
                            {
                                this.methods.map((method, ix) => {
                                    return (
                                        <li key={ix}>
                                            {this.renderMethodView(method, 'method_' + ix, this.isEditingMethod(method))}
                                        </li>
                                    )
                                })
                            }

                            {!this.isEditingMode() &&
                                <li className={"new rest-method editing"}>
                                    {this.methods.length > 0 &&
                                        !this.showCreateForm &&
                                        <button type={'button'}
                                                className={'form-button'}
                                                onClick={() => this.toggleCreateForm()}>
                                            Create method
                                        </button>
                                    }

                                    {this.showCreateForm &&
                                        <FormContainer onSubmit={() => this.addMethod()}>
                                            {this.renderMethodForm(this.newMethod, 'new_method')}

                                            <FormButtons>
                                                {this.methods.length > 0 &&
                                                    <button type={"button"}
                                                        onClick={() => this.toggleCreateForm()}>
                                                        Cancel
                                                    </button>
                                                }
                                                <button type={"submit"}>
                                                    <i className={"fa fa-plus"} />
                                                    <span>Save</span>
                                                </button>
                                            </FormButtons>

                                        </FormContainer>
                                    }
                                </li>
                            }
                        </ul>
                    </div>
                </div>
            </>
        )
    }
}