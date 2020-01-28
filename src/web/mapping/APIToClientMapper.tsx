import React, { Component } from "react";
import _ from 'lodash';
import { observer } from "mobx-react";
import {action, observable} from "mobx";

import {
    convertToEditMethod,
    convertToRestMethod,
    isCompatibleRESTMethods,
    RESTMethodEdit,
    RESTResourceSpec
} from "../types";

import {
    createEqualMapping,
    createSourceOnlyMapping,
    createTargetOnlyMapping,
    ItemTypes,
    MappedMethod,
    RESTMethodMappingEdit
} from "./types";

import {ConnectionMethodMappingType, ConnectionMethodsMapping, ResourceMapperProps} from "@blockware/ui-web-types";

import {
    DnDContainer,
    DnDDrag,
    DnDDrop,
    FormReadyHandler
} from "@blockware/ui-web-components";

import RestMethodView from "../RestMethodView";

import './APIToClientMapper.less';

interface RestResourceToClientMapperProps extends ResourceMapperProps<RESTResourceSpec, RESTResourceSpec, ConnectionMethodsMapping> {

}


@observer
export default class APIToClientMapper extends Component<RestResourceToClientMapperProps> {

    @observable
    private methods: MappedMethod[] = [];

    private sourceName: string = '';

    private targetName: string = '';

    private serverWasEmpty: boolean = false;

    private clientWasEmpty: boolean = false;

    constructor(props: RestResourceToClientMapperProps) {
        super(props);
    }

    private hasValidValue() {
        return (this.props.value && !_.isEmpty(this.props.value));
    }

    calculateMappingsFromProps() {

        this.clientWasEmpty = false;
        this.serverWasEmpty = false;

        let sourceMethods: RESTMethodEdit[] = [];

        _.forEach(this.props.source.spec.methods, (method, methodId) => {
            sourceMethods.push(convertToEditMethod(methodId, method));
        });

        let targetMethods: RESTMethodMappingEdit[] = [];

        _.forEach(this.props.target.spec.methods, (method, methodId) => {
            targetMethods.push(convertToEditMethod(methodId, method));
        });

        const mappedMethods: MappedMethod[] = [];

        const mappedTargets: RESTMethodEdit[] = [];
        const mappedSources: RESTMethodEdit[] = [];

        const hasValue = this.hasValidValue();

        if (this.props.value && hasValue) {

            Object.entries(this.props.value)
                .forEach(([sourceMethodId, mapping]) => {
                    const sourceMethod = _.find(sourceMethods, { id: sourceMethodId });

                    if (!sourceMethod) {
                        //TODO: Mark as invalid
                        console.warn('Source not found', sourceMethodId);
                        return;
                    }

                    const targetMethod = _.find(targetMethods, { id: mapping.targetId });
                    if (!targetMethod) {
                        //TODO: Mark as invalid
                        console.warn('Target not found', mapping.targetId);
                        return;
                    }

                    mappedTargets.push(targetMethod);
                    mappedSources.push(sourceMethod);

                    switch (mapping.type) {
                        case ConnectionMethodMappingType.EXACT: //Only exact mapping supported right now
                            mappedMethods.push(createEqualMapping(sourceMethod, targetMethod));

                            break;
                    }
                });
        }

        //If target or source methods are empty we assume it is a new connection and mapping - and copy everything
        if (targetMethods.length === 0) {
            targetMethods = sourceMethods.map((sourceMethod) => {
                return { ...sourceMethod, copyOf: sourceMethod };
            });

            this.targetName = this.sourceName;
            this.clientWasEmpty = true;
        } else if (sourceMethods.length === 0) {
            sourceMethods = targetMethods.map((targetMethods) => {
                return { ...targetMethods, copyOf: targetMethods };
            });

            this.sourceName = this.targetName;
            this.serverWasEmpty = true;
        }

        sourceMethods.forEach((sourceMethod) => {
            if (mappedSources.indexOf(sourceMethod) > -1) {
                return;
            }

            mappedSources.push(sourceMethod);

            for (let i = 0; i < targetMethods.length; i++) {
                let targetMethod = targetMethods[i];

                if (mappedTargets.indexOf(targetMethod) > -1) {
                    continue;
                }

                if (isCompatibleRESTMethods(targetMethod, sourceMethod, this.props.targetEntities, this.props.sourceEntities)) {
                    mappedTargets.push(targetMethod);
                    mappedMethods.push(createEqualMapping(sourceMethod, targetMethod));
                    return;
                }
            }

            //No matching target found
            mappedMethods.push(createSourceOnlyMapping(sourceMethod));

        });

        targetMethods.forEach((targetMethod) => {
            if (mappedTargets.indexOf(targetMethod) > -1) {
                return;
            }

            mappedMethods.push(createTargetOnlyMapping(targetMethod));
        });

        mappedMethods.sort((a, b) => {
            if (a.mapped !== b.mapped) {
                return a.mapped ? -1 : 1;
            }

            if (a.source && b.source) {
                if (a.source.copyOf && b.source.copyOf) {
                    return 0;
                }

                return 1;
            }

            if (!a.source && b.source) {
                return -1;
            }

            return 0;
        });

        return mappedMethods;
    }

    isValid() {
        for (let i = 0; i < this.methods.length; i++) {
            const method = this.methods[i];
            if (method.target && !method.mapped) {
                //All targets must be mapped to be valid
                return false;
            }
        }

        return this.methods.length > 0;
    }

    triggerChange() {
        if (!this.props.onDataChanged) {
            return;
        }

        const methods: ConnectionMethodsMapping = {};
        this.methods.forEach((method) => {


            if (!method.source ||
                !method.target ||
                !method.mapped) {
                return;
            }

            methods[method.source.id] = {
                targetId: method.target.id,
                type: ConnectionMethodMappingType.EXACT //We only support exact at the moment
            };
        });

        this.props.onDataChanged({
            source: this.props.source,
            sourceEntities: this.props.sourceEntities,
            target: this.props.target,
            targetEntities: this.props.targetEntities,
            data: methods
        });
    }

    renderInnerSourceColumn(ix: number, mappedMethod: MappedMethod, draggable: boolean, droppable: boolean) {

        const sourceClassNames = ['source'];

        if (draggable) {
            sourceClassNames.push('draggable');
        } else if (droppable) {
            sourceClassNames.push('dropzone');
        }

        return (
            <div className={sourceClassNames.join(' ')}>
                {mappedMethod.source &&
                <RestMethodView compact={true} method={mappedMethod.source} />
                }

                {!mappedMethod.source && mappedMethod.target &&
                <RestMethodView compact={true} method={mappedMethod.target} />
                }

                {mappedMethod.mapped && !droppable && mappedMethod.target && !mappedMethod.target.copyOf &&
                <div className={'actions'}>
                    <button type={'button'}
                            className={'button icon danger'} title={'Disconnect'}
                            onClick={() => this.removeSource(ix)}>
                        <i className={'fas fa-times'} />
                    </button>
                </div>
                }

                {!mappedMethod.mapped && !droppable && this.canAddToTarget(ix) &&
                <div className={'actions'}>
                    <button type={'button'}
                            className={'button icon friendly'} title={'Add'}
                            onClick={() => this.addToTarget(ix)}>
                        <i className={'fas fa-plus'} />
                    </button>
                </div>
                }

            </div>
        )
    }

    renderSourceColumn(ix: number, mappedMethod: MappedMethod) {

        const draggable: boolean = (!!mappedMethod.source && !mappedMethod.mapped);
        const dropZone: boolean = (!mappedMethod.source && !!mappedMethod.target);

        if (dropZone) {
            return (
                <DnDDrop type={ItemTypes.API_METHOD}
                         droppable={(source: RESTMethodEdit) => this.isValidSourceForTarget(ix, source)}
                         onDrop={(type, source: RESTMethodEdit) => this.addMappingForTarget(ix, source)}>
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

    componentWillMount() {
        this.refreshMethods();
    }

    private refreshMethods() {
        this.sourceName = this.props.source.metadata.name;
        this.targetName = this.props.target.metadata.name;
        this.methods = this.calculateMappingsFromProps();

        if (!this.hasValidValue()) {
            this.triggerChange();
        }
    }

    render() {



        return (

            <div className={"rest-resource-to-client-mapper"}>
                <FormReadyHandler name={this.props.name}
                                  ready={this.isValid()} />

                <div className={"header"}>
                    <div className={"source"}>
                        {this.sourceName}: REST API
                    </div>
                    <div className={"mapping-seperator"}>

                    </div>
                    <div className={"target"}>
                        {this.targetName}: REST Client
                    </div>
                </div>
                <DnDContainer>
                    <div className={"content"}>
                        {
                            this.methods.map((method, ix) => {

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
                                            <i title={'Mapped succesfully'} className={'fas fa-chevron-right'} />
                                            }

                                            {!method.source &&
                                            method.target &&
                                            <i title={'Missing mapping'} className={'fas fa-exclamation-triangle'} />
                                            }

                                        </div>
                                        <div className={"target"}>
                                            {method.target &&
                                            <>
                                                <RestMethodView compact={true} method={method.target} />
                                                {method.source && method.target.copyOf &&
                                                <div className={'actions'}>
                                                    <button type={'button'} className={'button icon danger'}
                                                            title={'Remove method'}
                                                            onClick={() => this.removeTarget(ix)}>
                                                        <i className={'fas fa-times'} />
                                                    </button>
                                                </div>
                                                }
                                                {!method.source && !method.target.copyOf && this.serverWasEmpty &&
                                                <div className={'actions'}>
                                                    <button type={'button'} className={'button icon friendly'} title={'Add'}
                                                            onClick={() => this.addToSource(ix)}>
                                                        <i className={'fas fa-plus'} />
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
            </div>
        )
    }

    canAddToTarget(ix: number): boolean {
        const source = this.methods[ix].source;
        if (!source) {
            return false;
        }

        return !_.find(this.methods, (method) => {
            if (method.source === source) {
                return false;
            }

            return method.target &&
                method.target.id === source.id;


        });
    }

    @action
    addToTarget(ix: number): void {
        const source = this.methods[ix].source;
        if (!source) {
            return;
        }

        const newTarget = { ...source, copyOf: source };

        //First add the method to the target resource
        this.props.target.spec.methods[source.id] = convertToRestMethod(newTarget);

        //Then add mapping for it
        this.methods.splice(ix, 1, createEqualMapping(source, newTarget));

        this.triggerChange();
    }

    @action
    addToSource(ix: number): void {
        const target = this.methods[ix].target;
        if (!target) {
            return;
        }

        const newSource = { ...target, copyOf: target };

        //First add the method to the source resource
        this.props.source.spec.methods[target.id] = convertToRestMethod(newSource);

        //Then add mapping for it

        this.methods.splice(ix, 1, createEqualMapping(newSource, target));

        this.triggerChange();
    }

    @action
    removeTarget(ix: number): void {
        const target = this.methods[ix].target;
        if (!target) {
            return;
        }

        //First remove the method from the target block
        delete this.props.target.spec.methods[target.id];

        //Then remove mapping for it
        const source = this.methods[ix].source;
        if (source) {
            this.methods.splice(ix, 1, createSourceOnlyMapping(source));
        } else {
            this.methods.splice(ix, 1);
        }

        this.triggerChange();
    }

    @action
    removeSource(ix: number): void {
        const method = this.methods[ix];
        const source = method.source;
        if (!source) {
            return;
        }



        if (!source.copyOf) {
            //If source is not a copy from target - readd it
            this.methods.push(createSourceOnlyMapping(source));
        } else {

        }

        if (method.target &&
            method.target.copyOf) { //If the target is a copy

            //First remove the method from the source resource
            delete this.props.source.spec.methods[source.id];

            //And remove the entire line
            _.pull(this.methods, method);
        } else {
            this.methods[ix].source = undefined;
            this.methods[ix].sourceId = undefined;
            this.methods[ix].mapped = false;
        }

        this.triggerChange();

    }

    @action
    addMappingForTarget(ix: number, source: RESTMethodEdit) {
        const target = this.methods[ix].target;
        if (!target) {
            return;
        }

        if (!isCompatibleRESTMethods(target, source, this.props.targetEntities, this.props.sourceEntities)) {
            return;
        }

        const existing = _.find(this.methods, { source: source, mapped: false });

        this.methods[ix].source = source;
        this.methods[ix].sourceId = source.id;
        this.methods[ix].mapped = true;

        _.pull(this.methods, existing);

        this.triggerChange();

    }

    isValidSourceForTarget(ix: number, source: RESTMethodEdit): boolean {
        const target = this.methods[ix].target;
        if (!target) {
            return false;
        }

        return isCompatibleRESTMethods(target, source, this.props.targetEntities, this.props.sourceEntities);
    }
}