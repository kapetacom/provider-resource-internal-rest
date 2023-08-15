import { Entity } from '@kapeta/schemas';
import { RESTMethodEdit, RESTResource } from '../types';
import { ConnectionMethodMappingType, ConnectionMethodsMapping } from '@kapeta/ui-web-types';

export enum ItemTypes {
    API_METHOD = 'API_METHOD',
    CLIENT_METHOD = 'CLIENT_METHOD',
}

export interface Mapping {
    arguments: FieldMapping[];
    responseType: TypeMapping;
}

export interface FieldMapping {
    sourceId: string;
    targetId: string;
    type: TypeMapping;
}

export interface TypeMapping {
    type: ConnectionMethodMappingType;
    fields?: FieldMapping[];
}

export interface MappedMethod {
    sourceId?: string;
    source?: RESTMethodMappingEdit;
    targetId?: string;
    target?: RESTMethodMappingEdit;
    mapped: boolean;
    mapping?: Mapping[];
}

export interface RESTMethodMappingEdit extends RESTMethodEdit {
    copyOf?: RESTMethodEdit;
}

export interface MappingHandlerContext {
    clientWasEmpty: boolean;
    serverWasEmpty: boolean;
    issues: string[];
    warnings: string[];
    targetName: string;
    sourceName: string;
}

export type MappingHandlerData = {
    source: RESTResource;
    sourceEntities: Entity[];
    target: RESTResource;
    targetEntities: Entity[];
    data: ConnectionMethodsMapping;
};

export function createEqualMapping(
    sourceMethod: RESTMethodMappingEdit,
    targetMethod: RESTMethodMappingEdit
): MappedMethod {
    return {
        sourceId: sourceMethod.id,
        source: sourceMethod,
        targetId: targetMethod.id,
        target: targetMethod,
        mapped: true,
    };
}

export function createTargetOnlyMapping(method: RESTMethodEdit): MappedMethod {
    return {
        targetId: method.id,
        target: method,
        mapped: false,
        mapping: [],
    };
}

export function createSourceOnlyMapping(method: RESTMethodEdit) {
    return {
        sourceId: method.id,
        source: method,
        mapped: false,
        mapping: [],
    };
}
