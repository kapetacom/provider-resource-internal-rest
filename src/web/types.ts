/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { RESTMethod, ResourceWithSpec } from '@kapeta/ui-web-types';
import { SourceCode } from '@kapeta/schemas';
import { DSLData, DSLCompatibilityHelper, DSLMethod } from '@kapeta/kaplang-core';

export interface RESTResourceSpec {
    port: {
        type: string;
    };
    source?: SourceCode;
    methods?: {
        [key: string]: RESTMethod;
    };
}

export interface RESTResource extends ResourceWithSpec<RESTResourceSpec> {}

export interface RESTMethodContext {
    method: DSLMethod;
    entities: DSLData[];
}

export interface RESTKindContext {
    resource: RESTResource;
    entities: DSLData[];
}

export function toRESTKindContext(resource: RESTResource, entities: DSLData[]): RESTKindContext {
    return {
        resource,
        entities,
    };
}

export function getCompatibleRESTMethodsIssues(aContext: RESTMethodContext, bContext: RESTMethodContext): string[] {
    const errors = [];
    const a = aContext.method;
    const b = bContext.method;
    const returnTypeIssues = DSLCompatibilityHelper.getIssuesForTypes(
        a.returnType,
        b.returnType,
        aContext.entities,
        bContext.entities
    );
    if (returnTypeIssues.length > 0) {
        errors.push('Response types are not compatible');
        errors.push(...returnTypeIssues);
    }

    const aArgs = a.parameters;
    const bArgs = b.parameters;

    if (!aArgs && !bArgs) {
        return errors;
    }

    if (!aArgs || !bArgs) {
        errors.push('Argument counts must be equal');
        return errors;
    }

    if (aArgs.length !== bArgs.length) {
        errors.push('Argument counts must be equal');
        return errors;
    }

    for (let i = 0; i < aArgs.length; i++) {
        const issues = DSLCompatibilityHelper.getIssuesForTypes(
            aArgs[i].type,
            bArgs[i].type,
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

export function isCompatibleRESTMethods(a: RESTMethodContext, b: RESTMethodContext): boolean {
    return getCompatibleRESTMethodsIssues(a, b).length === 0;
}

export const KIND_REST_API = 'kapeta/resource-type-rest-api';

export const KIND_REST_CLIENT = 'kapeta/resource-type-rest-client';
