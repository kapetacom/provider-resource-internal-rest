import React, {Component} from "react";
import _ from 'lodash';
import {observer} from "mobx-react";
import {action, makeObservable, observable, toJS} from "mobx";
import type {RESTMethodEdit, RESTResource, RESTResourceSpec} from "../types";
import type {MappedMethod, MappingHandlerContext} from "./types";
import {ItemTypes} from "./types";
import {ConnectionMethodsMapping, ResourceTypeProviderMappingProps} from "@kapeta/ui-web-types";
import {DnDContainer, DnDDrag, DnDDrop, FormReadyHandler} from "@kapeta/ui-web-components";
import RestMethodView from "../RestMethodView";
import {MappingHandler} from "./MappingHandler";
import {MappingHandlerBuilder} from "./MappingHandlerBuilder";
import {toRESTKindContext} from "../types";

import './APIToClientMapper.less';


const DangerIcon: React.FC = () => (
    <svg width="42" height="42" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="white" fillOpacity="0.4"/>
        <path d="M21.5146 10L9.99989 21.5148" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 10L21.5148 21.5148" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>);

interface RestResourceToClientMapperProps extends ResourceTypeProviderMappingProps<RESTResourceSpec, RESTResourceSpec, ConnectionMethodsMapping> {
    source: RESTResource;
    target: RESTResource;
}


@observer
export default class APIToClientMapper extends Component<RestResourceToClientMapperProps,any> {

    @observable
    private mappingHandler: MappingHandler;

    @observable
    private handlerContext:MappingHandlerContext = {
        clientWasEmpty: false,
        serverWasEmpty: false,
        sourceName: '',
        targetName: '',
        issues: [],
        warnings: []
    };

    constructor(props: RestResourceToClientMapperProps) {
        super(props);
        makeObservable(this);

        const sourceContext = toRESTKindContext(
            this.props.source,
            this.props.sourceEntities
        );

        const targetContext = toRESTKindContext(
            this.props.target,
            this.props.targetEntities
        );

        //We just init this to avoid having to null-check everywhere
        this.mappingHandler = new MappingHandler([], sourceContext, targetContext);
    }

    private hasValidValue() {
        return (this.props.value && !_.isEmpty(this.props.value));
    }

    private createMappingHandler(): MappingHandler {
        const sourceContext = toRESTKindContext(
            this.props.source,
            this.props.sourceEntities
        );

        const targetContext = toRESTKindContext(
            this.props.target,
            this.props.targetEntities
        );

        const builder = new MappingHandlerBuilder(sourceContext, targetContext);

        const result = builder.build(this.props.value);

        this.handlerContext = result;
        return result.handler;
    }

    private isValid() {
        if (this.handlerContext.issues.length > 0) {
            return false;
        }

        return this.mappingHandler.isValid()
    }

    private triggerChange() {
        if (!this.props.onDataChanged) {
            return;
        }

        this.props.onDataChanged(toJS(this.mappingHandler.toData()));
    }

    private renderInnerSourceColumn(ix: number, mappedMethod: MappedMethod, draggable: boolean, droppable: boolean) {

        const sourceClassNames = ['source'];

        if (draggable) {
            sourceClassNames.push('draggable');
        } else if (droppable) {
            sourceClassNames.push('dropzone');
        }

        return (
            <div className={sourceClassNames.join(' ')}>
                {mappedMethod.source &&
                    <RestMethodView compact={true} method={mappedMethod.source}/>
                }

                {!mappedMethod.source && mappedMethod.target &&
                    <RestMethodView compact={true} method={mappedMethod.target}/>
                }

                {mappedMethod.mapped && !droppable && mappedMethod.target && !mappedMethod.target.copyOf &&
                    <div className={'actions'}>
                        <button type={'button'}
                                className={'button icon danger'} title={'Disconnect'}
                                onClick={() => this.mappingHandler.removeSource(ix)}>
                            <i className={'fas fa-times'}/>
                        </button>
                    </div>
                }

                {!mappedMethod.mapped && !droppable && this.mappingHandler.canAddToTarget(ix) &&
                    <div className={'actions'}>
                        <button type={'button'}
                                className={'button icon friendly'} title={'Add'}
                                onClick={() => this.mappingHandler.addToTarget(ix)}>
                            <i className={'fas fa-plus'}/>
                        </button>
                    </div>
                }

            </div>
        )
    }

    private renderSourceColumn(ix: number, mappedMethod: MappedMethod) {

        const draggable: boolean = (!!mappedMethod.source && !mappedMethod.mapped);
        const dropZone: boolean = (!mappedMethod.source && !!mappedMethod.target);

        if (dropZone) {
            return (
                <DnDDrop type={ItemTypes.API_METHOD}
                         droppable={(source: RESTMethodEdit) => this.mappingHandler.canDropOnTarget(ix, source)}
                         onDrop={(type, source: RESTMethodEdit) => this.mappingHandler.addMappingForTarget(ix, source)}>
                    {this.renderInnerSourceColumn(ix, mappedMethod, draggable, dropZone)}
                </DnDDrop>
            );
        }

        if (draggable) {
            return (
                <DnDDrag type={ItemTypes.API_METHOD} value={mappedMethod.source} horizontal={false}>
                    {this.renderInnerSourceColumn(ix, mappedMethod, draggable, dropZone)}
                </DnDDrag>
            );
        }

        return (
            <>
                {this.renderInnerSourceColumn(ix, mappedMethod, draggable, dropZone)}
            </>
        );
    }

    componentDidMount() {
        this.refreshMethods();
    }

    @action
    private refreshMethods() {
        this.mappingHandler = this.createMappingHandler();
        this.mappingHandler.on('change', () => this.triggerChange());

        if (!this.hasValidValue()) {
            this.triggerChange();
        }
    }

    render() {

        return (

            <div className={"rest-resource-to-client-mapper"}>
                <FormReadyHandler name={this.props.title}
                                  ready={this.isValid()}>

                    {this.handlerContext.issues.length > 0 && (
                        <div className={'issues'}>
                            <DangerIcon/>
                            <div className={'content'}>
                                <div>
                                    Identified the following incompatibility issues with
                                    entities in this connection:
                                </div>
                                <ul>
                                    {this.handlerContext.issues.map((error, ix) => {
                                        return (
                                            <li key={`error_${ix}`}>{error}</li>
                                        )
                                    })}
                                </ul>
                                <div>
                                    You'll need to correct these issues before you can fully map this connection.
                                </div>
                            </div>
                        </div>
                    )}

                    {this.handlerContext.warnings.length > 0 && (
                        <div className={'warnings'}>
                            <div>
                                The following warnings were encountered when reading connection mapping:
                            </div>
                            <div className={'content'}>
                                <ul>
                                    {this.handlerContext.warnings.map((error, ix) => {
                                        return (
                                            <li key={`error_${ix}`}>{error}</li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className={"header"}>
                        <div className={"source"}>
                            {this.handlerContext.sourceName}: REST API
                        </div>
                        <div className={"mapping-seperator"}>

                        </div>
                        <div className={"target"}>
                            {this.handlerContext.targetName}: REST Client
                        </div>
                    </div>
                    <DnDContainer>
                        <div className={"content"}>
                            {
                                this.mappingHandler.methods.map((method, ix) => {

                                    const methodMappingClassName = ['method-mapping'];

                                    methodMappingClassName.push(method.mapped ? 'mapped' : 'unmapped');

                                    if (!method.source && method.target) {
                                        methodMappingClassName.push('unmapped-source');
                                    }

                                    if (!method.target && method.source) {
                                        methodMappingClassName.push('unmapped-target');
                                    }

                                    return (

                                        <div key={ix} className={methodMappingClassName.join(' ')}>

                                            {this.renderSourceColumn(ix, method)}

                                            <div className={'mapping-seperator'}>
                                                {method.mapped &&
                                                    <i title={'Mapped succesfully'} className={'fas fa-chevron-right'}/>
                                                }

                                                {!method.source &&
                                                    method.target &&
                                                    <i title={'Missing mapping'}
                                                       className={'fas fa-exclamation-triangle'}/>
                                                }

                                            </div>
                                            <div className={"target"}>
                                                {method.target &&
                                                    <>
                                                        <RestMethodView compact={true} method={method.target}/>
                                                        {method.source && method.target.copyOf &&
                                                            <div className={'actions'}>
                                                                <button type={'button'} className={'button icon danger'}
                                                                        title={'Remove method'}
                                                                        onClick={() => this.mappingHandler.removeTarget(ix)}>
                                                                    <i className={'fas fa-times'}/>
                                                                </button>
                                                            </div>
                                                        }
                                                        {!method.source && !method.target.copyOf && this.handlerContext.serverWasEmpty &&
                                                            <div className={'actions'}>
                                                                <button type={'button'}
                                                                        className={'button icon friendly'} title={'Add'}
                                                                        onClick={() => this.mappingHandler.addToSource(ix)}>
                                                                    <i className={'fas fa-plus'}/>
                                                                </button>
                                                            </div>
                                                        }

                                                    </>
                                                }
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </DnDContainer>
                </FormReadyHandler>
            </div>
        )
    }


}