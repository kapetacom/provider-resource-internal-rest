import {action, makeObservable, observable, toJS} from "mobx";
import {showToasty, ToastType} from "@kapeta/ui-web-components";
import {getCompatibleRESTMethodsIssues} from "../types";
import type {RESTMethodEdit, RESTKindContext} from "../types";
import {createEqualMapping, createSourceOnlyMapping, MappedMethod} from "./types";
import _ from "lodash";
import {getEntitiesToBeAddedForCopy} from "./MappingUtils";
import {deleteRESTMethod, setRESTMethod} from "../RESTUtils";
import {ConnectionMethodMappingType, ConnectionMethodsMapping} from "@kapeta/ui-web-types";
import {EventEmitter} from 'events'

export class MappingHandler extends EventEmitter {

    @observable
    public readonly methods: MappedMethod[];

    @observable
    private readonly source: RESTKindContext;

    @observable
    private readonly target: RESTKindContext;

    constructor(methods: MappedMethod[], source: RESTKindContext, target: RESTKindContext) {
        super();
        makeObservable(this);
        this.source = toJS(source);
        this.target = toJS(target);
        this.methods = toJS(methods);
    }

    public isValid(): boolean {
        for (let i = 0; i < this.methods.length; i++) {
            const method = this.methods[i];
            if (method.target && !method.mapped) {
                //All targets must be mapped to be valid
                return false;
            }
        }

        return this.methods.length > 0;
    }

    public toData() {
        return {
            source: toJS(this.source.resource),
            sourceEntities: toJS(this.source.entities),
            target: toJS(this.target.resource),
            targetEntities: toJS(this.target.entities),
            data: this.toMappingData()
        }
    }

    public toMappingData(): ConnectionMethodsMapping {
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

        return methods;
    }

    public canAddToTarget(ix: number): boolean {
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


    public canDropOnTarget(ix: number, source: RESTMethodEdit): boolean {
        return !!this.methods[ix].target;
    }

    @action
    public addToTarget(ix: number): void {
        const source = this.methods[ix].source;
        if (!source) {
            return;
        }

        const newTarget = {...toJS(source), copyOf: source};

        const {
            issues,
            entitiesToBeAdded
        } = getEntitiesToBeAddedForCopy(
            {method: source, entities: this.source.entities},
            {method: newTarget, entities: this.target.entities}
        );

        if (issues.length > 0) {
            showToasty({
                title: 'Could not add method',
                type: ToastType.ALERT,
                message: issues[0]
            })
            return;
        }

        this.target.entities.push(...entitiesToBeAdded);

        //First add the method to the target resource
        setRESTMethod(this.target.resource.spec, source.id, newTarget);
        //Then add mapping for it
        this.methods.splice(ix, 1, createEqualMapping(source, newTarget));

        this.triggerChange();
    }

    @action
    public addToSource(ix: number): void {
        const target = this.methods[ix].target;
        if (!target) {
            return;
        }

        const newSource = {...toJS(target), copyOf: target};

        const {
            issues,
            entitiesToBeAdded
        } = getEntitiesToBeAddedForCopy(
            {method: target, entities: this.target.entities},
            {method: newSource, entities: this.source.entities}
        );

        if (issues.length > 0) {
            showToasty({
                title: 'Could not add method',
                type: ToastType.ALERT,
                message: issues[0]
            })
            return;
        }

        this.source.entities.push(...entitiesToBeAdded);

        //First add the method to the source resource
        setRESTMethod(this.source.resource.spec, target.id, newSource);

        //Then add mapping for it
        this.methods.splice(ix, 1, createEqualMapping(newSource, target));

        this.triggerChange();
    }

    @action
    public removeTarget(ix: number): void {
        const target = this.methods[ix].target;
        if (!target) {
            return;
        }

        //First remove the method from the target block
        deleteRESTMethod(this.target.resource.spec, target.id);
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
    public removeSource(ix: number): void {
        const method = this.methods[ix];
        const source = method.source;
        if (!source) {
            return;
        }


        if (!source.copyOf) {
            //If source is not a copy from target - readd it
            this.methods.push(createSourceOnlyMapping(source));
        }

        if (method.target &&
            method.target.copyOf) { //If the target is a copy

            //First remove the method from the source resource
            deleteRESTMethod(this.source.resource.spec, source.id);
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
    public addMappingForTarget(ix: number, source: RESTMethodEdit) {
        const target = this.methods[ix].target;
        if (!target) {
            return;
        }

        const errors = getCompatibleRESTMethodsIssues(
            {method: target, entities: this.target.entities},
            {method: source, entities: this.source.entities}
        );

        if (errors.length > 0) {
            showToasty({
                title: 'Methods did not match',
                type: ToastType.ALERT,
                message: errors[0]
            })
            return;
        }

        const existing = _.find(this.methods, {source: source, mapped: false});

        this.methods[ix].source = source;
        this.methods[ix].sourceId = source.id;
        this.methods[ix].mapped = true;

        _.pull(this.methods, existing);

        this.triggerChange();

    }

    private triggerChange() {
        this.emit('change');
    }
}