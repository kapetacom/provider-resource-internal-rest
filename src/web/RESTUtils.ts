/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import _ from 'lodash';

import { RESTMethodArgument, TypedValue } from '@kapeta/ui-web-types';

import {
    convertToRestMethod,
    RESTKindContext,
    RESTMethodContext,
    RESTMethodEdit,
    RESTMethodEditContext,
    RESTResourceSpec,
} from './types';

import { Resource } from '@kapeta/schemas';
import { DSLConverters, EntityHelpers, KAPLANG_ID, KaplangWriter, TypeLike } from '@kapeta/kaplang-core';
import isSameType = EntityHelpers.isSameType;
import toComparisonType = EntityHelpers.toComparisonType;

export const getCounterValue = (data: Resource): number => {
    return _.size(data.spec.methods);
};

export const hasMethod = (data: Resource, methodId: string): boolean => {
    return methodId in data.spec.methods;
};

export function validateApiName(fieldName: string, name: string) {
    if (!name) {
        return;
    }

    if (!/^[a-zA-Z_$][a-zA-Z\d_$]*$/.test(name)) {
        throw new Error('Invalid API name');
    }
}

export const validate = (context: RESTKindContext): string[] => {
    const errors: string[] = [];
    const entityNames = resolveEntities(context);

    const missingEntities = entityNames.filter((entityName) => {
        return !context.entities.some((entity) => isSameType(entityName, toComparisonType(entity.name)));
    });

    if (missingEntities.length > 0) {
        if (missingEntities.length === 1) {
            errors.push(`${missingEntities[0]} is not defined in this block. Create entity to solve this issue`);
        } else {
            errors.push(
                `Multiple entities are not defined in this block: ${missingEntities.join(
                    ', '
                )}. Create these entities to solve this issue`
            );
        }
    }

    const restSpec = context.resource.spec as RESTResourceSpec;

    _.forEach(restSpec.methods, (method, methodId) => {
        if (!method.path) {
            errors.push(`${methodId} is missing path. Add path to solve this issue`);
        }

        if (!method.method) {
            errors.push(`${methodId} is missing HTTP method. Define an HTTP method to solve this issue`);
        }

        if (!method.arguments) {
            return;
        }

        const invalidArguments = Object.entries(method.arguments)
            .filter(([, argument]: [string, RESTMethodArgument]) => {
                if (!argument.type && !argument.ref) {
                    return true;
                }

                return !argument.transport;
            })
            .map(([methodId, argument]) => methodId);

        if (invalidArguments.length > 0) {
            errors.push(
                `${methodId} is missing a type and/or a transport for the following arguments: ${invalidArguments.join(
                    ', '
                )}. Add type and transport to all arguments to solve this issue.`
            );
        }
    });

    return errors;
};

export function resolveEntitiesFromMethod(context: RESTMethodContext | RESTMethodEditContext): string[] {
    const out: string[] = [];

    function maybeAddEntity(type?: TypeLike) {
        if (!type || (!type.ref && !type.type) || EntityHelpers.isBuiltInType(type)) {
            return;
        }

        const generic = EntityHelpers.parseGeneric(type);
        if (generic) {
            if (!EntityHelpers.isBuiltInGeneric(type)) {
                // Not supported by the DSL but we handle it anyway
                const genericName = EntityHelpers.typeName(type);
                if (!out.includes(genericName)) {
                    out.push(genericName);
                }
            }

            generic.arguments.forEach((arg) => {
                maybeAddEntity({ type: arg });
            });
            return;
        }

        const entityName = EntityHelpers.typeName(type);
        if (!out.includes(entityName)) {
            out.push(entityName);
        }
    }

    maybeAddEntity(context.method.responseType);

    if (context.method.arguments) {
        Object.values(context.method.arguments).forEach(maybeAddEntity);
    }

    return out;
}

export function setRESTMethod(spec: RESTResourceSpec, id: string, method: RESTMethodEdit) {
    if (!spec.methods) {
        spec.methods = {};
    }
    spec.methods[id] = convertToRestMethod(method);
    spec.source = convertRESTToDSLSource(spec);
}

export function deleteRESTMethod(spec: RESTResourceSpec, id: string) {
    if (!spec.methods) {
        spec.methods = {};
    }
    delete spec.methods[id];
    spec.source = convertRESTToDSLSource(spec);
}

export function convertRESTToDSLSource(spec: RESTResourceSpec): TypedValue {
    const dslMethods = spec.methods ? DSLConverters.fromSchemaMethods(spec.methods) : [];
    return {
        type: KAPLANG_ID,
        value: KaplangWriter.write(dslMethods),
    };
}

export function resolveEntities(context: RESTKindContext): string[] {
    const out: string[] = [];

    if (!context.resource.spec.methods) {
        return out;
    }

    const restSpec = context.resource.spec as RESTResourceSpec;
    if (!restSpec.methods) {
        return out;
    }

    Object.values(restSpec.methods).forEach((method) => {
        const usedEntities = resolveEntitiesFromMethod({ method, entities: context.entities });

        usedEntities.forEach((entity) => {
            if (out.indexOf(entity) === -1) {
                out.push(entity);
            }
        });
    });

    return out;
}

export function renameEntityReferences(resource: Resource, from: string, to: string): void {
    function maybeRenameEntity(type: TypeLike): TypeLike {
        if (EntityHelpers.isBuiltInType(type)) {
            return type;
        }

        if (EntityHelpers.typeName(type) !== from) {
            return type;
        }

        if (EntityHelpers.isList(type)) {
            return {
                ...type,
                ref: to + '[]',
            };
        }

        return {
            ...type,
            ref: to,
        };
    }

    const restSpec = resource.spec as RESTResourceSpec;
    if (!restSpec.methods) {
        return;
    }

    Object.values(restSpec.methods).forEach((method) => {
        if (method.responseType) {
            method.responseType = maybeRenameEntity(method.responseType);
        }

        if (!method.arguments) {
            return;
        }

        const argumentMap = method.arguments;

        const methodIds = Object.keys(argumentMap);

        methodIds.forEach((methodId) => {
            argumentMap[methodId] = maybeRenameEntity(argumentMap[methodId]);
        });
    });

    restSpec.source = convertRESTToDSLSource(restSpec);
}
