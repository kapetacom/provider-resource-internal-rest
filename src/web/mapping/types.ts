/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { RESTResource } from '../types';
import { ConnectionMethodMappingType, ConnectionMethodsMapping } from '@kapeta/ui-web-types';
import { DSLData, DSLMethod } from '@kapeta/kaplang-core';

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

export interface DSLControllerMethod extends DSLMethod {
    namespace?: string;
}

export function toId(method: DSLControllerMethod): string {
    return method.namespace ? `${method.namespace}::${method.name}` : method.name;
}

export function createId(namespace: string, name: string): string {
    return `${namespace}::${name}`;
}

export interface MappedMethod {
    sourceId?: string;
    source?: MappedMethodInfo;
    targetId?: string;
    target?: MappedMethodInfo;
    mapped: boolean;
    mapping?: Mapping[];
    errors?: string[];
}

export interface MappedMethodInfo extends DSLControllerMethod {
    copyOf?: DSLControllerMethod;
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
    sourceEntities: DSLData[];
    target: RESTResource;
    targetEntities: DSLData[];
    data: ConnectionMethodsMapping;
};

export function createEqualMapping(
    sourceMethod: MappedMethodInfo,
    targetMethod: MappedMethodInfo,
    errors?: string[]
): MappedMethod {
    return {
        sourceId: toId(sourceMethod),
        source: sourceMethod,
        targetId: toId(targetMethod),
        target: targetMethod,
        mapped: true,
        errors,
    };
}

export function createTargetOnlyMapping(method: DSLControllerMethod, errors?: string[]): MappedMethod {
    return {
        targetId: toId(method),
        target: method,
        mapped: false,
        mapping: [],
        errors,
    };
}

export function createSourceOnlyMapping(method: DSLControllerMethod, errors?: string[]) {
    return {
        sourceId: toId(method),
        source: method,
        mapped: false,
        mapping: [],
        errors,
    };
}
