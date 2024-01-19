/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { forEach } from 'lodash';
import { HTTPMethod, TypedValue, RESTMethod, TypeLike, RESTMethodArgument } from '@kapeta/ui-web-types';
import { Entity, Resource } from '@kapeta/schemas';
import { EntityHelpers } from '@kapeta/kaplang-core';

export interface RESTResourceSpec {
    port: {
        type: string;
    };
    source?: TypedValue;
    methods?: {
        [key: string]: RESTMethod;
    };
}

export interface RESTResource extends Resource {
    spec: RESTResourceSpec;
}

export interface RESTMethodArgumentEdit extends TypeLike {
    id: string;
    transport?: string;
    optional?: boolean;
}

export interface RESTMethodEdit {
    id: string;
    description: string;
    method: HTTPMethod;
    path: string;
    arguments: RESTMethodArgumentEdit[];
    responseType?: TypeLike;
    controllerName?: string;
}

export interface RESTMethodEditContext {
    method: RESTMethodEdit;
    entities: Entity[];
}

export interface RESTMethodContext {
    method: RESTMethod;
    entities: Entity[];
}

export interface RESTKindContext {
    resource: RESTResource;
    entities: Entity[];
}

export function toRESTKindContext(resource: RESTResource, entities: Entity[]): RESTKindContext {
    return {
        resource,
        entities,
    };
}

export function convertToEditMethod(id: string, method: RESTMethod): RESTMethodEdit {
    const tmp: RESTMethodEdit = {
        id,
        description: method.description || '',
        method: method.method,
        arguments: [],
        path: method.path,
        responseType: method.responseType,
        controllerName: method.controllerName,
    };

    forEach(method.arguments, (arg, argId) => {
        tmp.arguments.push({ ...arg, id: argId, optional: arg.optional });
    });

    return tmp;
}

export function convertAllToEditMethods(resource: RESTResource): RESTMethodEdit[] {
    const out: RESTMethodEdit[] = [];
    if (!resource.spec.methods) {
        return out;
    }
    forEach(resource.spec.methods, (method, methodId) => {
        out.push(convertToEditMethod(methodId, method));
    });

    return out;
}

export function convertToRestMethod(method: RESTMethodEdit): RESTMethod {
    const args: Record<string, RESTMethodArgument> = {};
    method.arguments.forEach(({ id, transport, type, ref, optional }) => {
        args[id] = { transport, type, ref, optional };
    });

    return {
        description: method.description,
        method: method.method,
        path: method.path,
        arguments: args,
        responseType: method.responseType,
        controllerName: method.controllerName,
    } satisfies RESTMethod;
}

export function getCompatibleRESTMethodsIssues(
    aContext: RESTMethodEditContext,
    bContext: RESTMethodEditContext
): string[] {
    const errors = [];
    const a = aContext.method;
    const b = bContext.method;
    if (!EntityHelpers.isCompatibleTypes(a.responseType, b.responseType, aContext.entities, bContext.entities)) {
        errors.push('Response types are not compatible');
    }

    const aArgs = a.arguments;
    const bArgs = b.arguments;

    if (aArgs.length !== bArgs.length) {
        errors.push('Argument counts is not compatible');
    }

    for (let i = 0; i < aArgs.length; i++) {
        const issues = EntityHelpers.getCompatibilityIssuesForTypes(
            aArgs[i],
            bArgs[i],
            aContext.entities,
            bContext.entities
        );

        if (aArgs[i] && bArgs[i]) {
            const aOptional = Boolean(aArgs[i].optional);
            const bOptional = Boolean(bArgs[i].optional);
            if (aOptional !== bOptional) {
                errors.push(`Argument ${i + 1} is not compatible because one is optional and the other is not`);
            }
        }

        if (bArgs[i] && issues.length > 0) {
            errors.push(`Argument ${i + 1} type is not compatible: ${issues[0]}`);
        }
    }

    return errors;
}

export function isCompatibleRESTMethods(a: RESTMethodEditContext, b: RESTMethodEditContext): boolean {
    return getCompatibleRESTMethodsIssues(a, b).length === 0;
}

export const KIND_REST_API = 'kapeta/resource-type-rest-api';

export const KIND_REST_CLIENT = 'kapeta/resource-type-rest-client';
