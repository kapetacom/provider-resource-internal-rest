import { observer } from "mobx-react";
import React, { ChangeEvent, Component } from "react";
import { action, observable, toJS } from "mobx";
import _ from "lodash";

import {
    EntityPicker,
    FormContainer,
    FormButtons,
    SingleLineInput,
    DropdownInput,
    MultiLineInput,
    Button,
    ButtonType
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

const EditIcon = () =>
    <svg className="svg-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" >
        <path fill-rule="evenodd" clipRule="evenodd" d="M2 0C0.89543 0 0 0.895431 0 2V13C0 14.1046 0.895431 15 2 15H13C14.1046 15 15 14.1046 15 13V2C15 0.89543 14.1046 0 13 0H2Z" fill="#009AA9" />
        <path d="M9.77012 2.76391C10.1373 2.31805 10.7964 2.25425 11.2422 2.62142C11.6881 2.9886 11.7519 3.64769 11.3847 4.09355L6.09357 10.5187L4.47896 9.18905L9.77012 2.76391Z" fill="white" />
        <path d="M3.93768 9.84631L5.55229 11.176L3.21064 12.3743L3.93768 9.84631Z" fill="white" />
    </svg>;

const DeleteIcon = () =>
    <svg className="svg-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" >
        <path fill-rule="evenodd" clip-rule="evenodd" d="M2 0C0.89543 0 0 0.895431 0 2V13C0 14.1046 0.895431 15 2 15H13C14.1046 15 15 14.1046 15 13V2C15 0.89543 14.1046 0 13 0H2Z" fill="#FA7B6E" />
        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.7488 4.79167H4.24883V11.2917C4.24883 11.8897 4.73416 12.375 5.3327 12.375H9.66549C10.2646 12.375 10.7488 11.8897 10.7488 11.2917V4.79167ZM8.85385 2.62445H6.14552L5.60439 3.16666H4.24968C3.95122 3.16666 3.70856 3.40933 3.70856 3.70778V4.24999H11.2919V3.70778C11.2919 3.40933 11.0492 3.16666 10.7497 3.16666H9.39606L8.85385 2.62445Z" fill="white" />
    </svg>;

const showArgumentsCheckbox = (isChecked: boolean) =>
    <div>
        {isChecked ?
            <svg className="arguments-checkbox" width="17" height="17" viewBox="0 0 13 13" fill="none" >
                <path d="M0 1.95C0 0.873044 0.873045 0 1.95 0H11.05C12.127 0 13 0.873045 13 1.95V11.05C13 12.127 12.127 13 11.05 13H1.95C0.873044 13 0 12.127 0 11.05V1.95Z" fill="#009AA9" />
                <path fill-rule="evenodd" clip-rule="evenodd" d="M5.20044 9.75L1.95044 6.625L2.86044 5.75L5.20044 8L10.1404 3.25L11.0504 4.125L5.20044 9.75Z" fill="#F5F1EE" />
            </svg> :
            <svg className="arguments-checkbox" width="17" height="17" viewBox="0 0 13 13" fill="none" >
                <path fill-rule="evenodd" clip-rule="evenodd" d="M11.05 1.3H1.95C1.59101 1.3 1.3 1.59101 1.3 1.95V11.05C1.3 11.409 1.59101 11.7 1.95 11.7H11.05C11.409 11.7 11.7 11.409 11.7 11.05V1.95C11.7 1.59101 11.409 1.3 11.05 1.3ZM1.95 0C0.873045 0 0 0.873044 0 1.95V11.05C0 12.127 0.873044 13 1.95 13H11.05C12.127 13 13 12.127 13 11.05V1.95C13 0.873045 12.127 0 11.05 0H1.95Z" fill="#908988" />
            </svg>
        }
        <span>Arguments</span>
    </div>;

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

    @observable
    private showArguments: boolean = false;

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
    private handleMetaDataChanged(name: string, input: string) {
        this.metadata[name] = input.trim();

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
                    <SingleLineInput
                        name={key + '_method.argument.' + ix + '.id'}
                        value={argument.id}
                        label={'Name'}
                        validation={['required', validateArgumentName]}
                        help={''}
                        onChange={(name: string, input: string) => this.setArgumentField(method, argument, 'id', input.trim())}
                    />

                    <EntityPicker name={key + '_method.argument.' + ix + '.type'}
                        value={typeValue(argument.type)}
                        entities={this.props.block.getEntityNames()}
                        onEntityCreated={(newEntity) => this.props.block.addEntity(newEntity)}
                        onChange={(value: any) => {
                            this.setArgumentField(method, argument, 'type', value);

                        }} />

                    <DropdownInput
                        name={key + '_method.argument.' + ix + '.transport'}
                        value={argument.transport ? argument.transport.toUpperCase() : HTTPTransport.QUERY}
                        label={'Transport'}
                        validation={['required']}
                        help={"This tells the code generation process which target programming language to use."}
                        onChange={(name: string, input: string) => this.setArgumentField(method, argument, 'transport', HTTPTransport[input.trim()])}
                        options={Object.keys(HTTPTransport).map((methodName) => methodName)}
                    />

                </div>
            </>
        )
    }

    renderMethodForm(method: RESTMethodEdit, key: string) {


        return (
            <>
                <SingleLineInput
                    name={key + '_method.id'}
                    value={method.id}
                    label={'Method name'}
                    validation={['required', validateMethodName]}
                    help={'This will be used when generating code. E.g. getSomething'}
                    onChange={(name: string, input: string) => this.setMethodField(method, 'id', input.trim())}
                />

                <MultiLineInput
                    name={key + '_method.description'}
                    value={method.description}
                    label={'Description'}
                    validation={[]}
                    help={'Describe your method so others understand what it does'}
                    onChange={(name: string, input: string) => this.setMethodField(method, 'method', HTTPMethod[input.trim()])}
                />

                <div className={'rest-method-path form-horizontal-rows'}>

                    <div className={"rest-http-method"}>
                        <DropdownInput
                            name={key + '_method.method'}
                            value={method.method}
                            label={'HTTP Method'}
                            validation={['required']}
                            help={'Choose your HTTP method'}
                            onChange={(name: string, input: string) => this.setMethodField(method, 'method', HTTPMethod[input.trim()])}
                            options={Object.keys(HTTPMethod).map((methodName) => methodName)}
                        />
                    </div>

                    <div className={"rest-http-path"}>
                        <SingleLineInput
                            name={key + '_method.path'}
                            value={method.path}
                            label={'Path'}
                            validation={['required', validatePath]}
                            help={'Path variables are denoted with { and } - e.g. /my/{id}'}
                            onChange={(name: string, input: string) => this.setMethodField(method, 'path', input.trim())}
                        />
                    </div>
                </div>

                <EntityPicker name={key + '_method.responseType'}
                    value={typeValue(method.responseType)}
                    entities={this.props.block.getEntityNames()}
                    onEntityCreated={(newEntity) => this.props.block.addEntity(newEntity)}
                    allowVoid={true}
                    onChange={(value: any) => this.setMethodField(method, 'responseType', value)}
                    label={"Response type"}
                    help={"Choose your response type - this is the methods return type."}
                />

                <hr></hr>

                <div className="container-checkbox" onClick={()=> this.showArguments = !this.showArguments}>
                    {showArgumentsCheckbox(this.showArguments)}
                </div>

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
                        <div className={"actions"}>
                            <div className={"edit-icon"} onClick={() => this.editMethod(method)}>
                                <EditIcon />
                            </div>
                            <div className={"delete-icon"} onClick={() => this.deleteMethod(method)}>
                                <DeleteIcon />
                            </div>
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

                    <SingleLineInput
                        name={"name"}
                        value={this.metadata.name}
                        label={"Name"}
                        validation={['required', validateApiName]}
                        help={"Name your REST API. E.g. MyApi"}
                        onChange={(name: string, input: string) => this.handleMetaDataChanged(name, input)}
                    />



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

                            {!this.isEditingMode() && this.showCreateForm &&
                                <li className={"rest-method editing"}>
                                    <span className={"method-label"}>Create New Method</span>
                                    <div className={"delete-icon"} onClick={() => this.toggleCreateForm()}>
                                        <DeleteIcon />
                                    </div>
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
                                </li>
                            }
                            {!this.isEditingMode() && this.methods.length > 0 && !this.showCreateForm &&
                                <FormButtons>
                                    <Button buttonType={ButtonType.PROCEED} width={130} onClick={() => this.toggleCreateForm()} text="Create method" />
                                </FormButtons>
                            }
                        </ul>
                    </div>
                </div>
            </>
        )
    }
}