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

import { DSL_LANGUAGE_ID, DSLConverters, DSLWriter } from '@kapeta/ui-web-components';
import { Entity, isBuiltInType, isDTO, isList, Resource, TypeLike, typeName } from '@kapeta/schemas';

export const getCounterValue = (data: Resource): number => {
    return _.size(data.spec.methods);
};

export const hasMethod = (data: Resource, methodId: string): boolean => {
    return methodId in data.spec.methods;
};

export const validate = (context: RESTKindContext): string[] => {
    const errors: string[] = [];
    const entityNames = resolveEntities(context);

    const missingEntities = entityNames.filter((entityName) => {
        return !context.entities.some((entity) => entity.name === entityName);
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

export function resolveEntitiesFromEntity(entity: Entity, entities: Entity[]): Entity[] {
    if (!isDTO(entity)) {
        return [];
    }

    const out: string[] = [];

    Object.values(entity.properties).forEach((property) => {
        if (typeof property.type === 'string') {
            return;
        }

        const name = typeName(property.type);
        if (entity.name === name) {
            return;
        }

        if (out.indexOf(name) > -1) {
            return;
        }

        out.push(name);

        const subEntity = entities.find((e) => e.name === name);

        if (subEntity) {
            const subEntityEntities = resolveEntitiesFromEntity(subEntity, entities);
            subEntityEntities.forEach((e) => {
                if (out.indexOf(e.name) === -1) {
                    out.push(e.name);
                }
            });
        }
    });

    return out.map((name) => entities.find((e) => e.name === name)).filter((e) => !!e) as Entity[];
}

export function resolveEntitiesFromMethod(context: RESTMethodContext | RESTMethodEditContext): string[] {
    const out: string[] = [];

    function maybeAddEntity(type?: TypeLike) {
        if (!type || (!type.ref && !type.type) || isBuiltInType(type)) {
            return;
        }

        const entityName = typeName(type);
        if (out.indexOf(entityName) === -1) {
            out.push(entityName);
        }

        const entity = context.entities.find((e) => e.name === entityName);
        if (entity) {
            const subEntities = resolveEntitiesFromEntity(entity, context.entities);
            subEntities.forEach((subEntity) => {
                if (out.indexOf(subEntity.name) === -1) {
                    out.push(subEntity.name);
                }
            });
        }
    }

    maybeAddEntity(context.method.responseType);

    if (context.method.arguments) {
        Object.values(context.method.arguments).forEach((arg) => {
            maybeAddEntity(arg);
        });
    }

    return out;
}

export function setRESTMethod(spec: RESTResourceSpec, id: string, method: RESTMethodEdit) {
    spec.methods[id] = convertToRestMethod(method);
    spec.source = convertRESTToDSLSource(spec);
}

export function deleteRESTMethod(spec: RESTResourceSpec, id: string) {
    delete spec.methods[id];
    spec.source = convertRESTToDSLSource(spec);
}

export function convertRESTToDSLSource(spec: RESTResourceSpec): TypedValue {
    const dslMethods = DSLConverters.fromSchemaMethods(spec.methods);
    return {
        type: DSL_LANGUAGE_ID,
        value: DSLWriter.write(dslMethods),
    };
}

export function resolveEntities(context: RESTKindContext): string[] {
    const out: string[] = [];

    if (!context.resource.spec.methods) {
        return out;
    }

    const restSpec = context.resource.spec as RESTResourceSpec;

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
        if (isBuiltInType(type)) {
            return type;
        }

        if (typeName(type) !== from) {
            return type;
        }

        if (isList(type)) {
            return { ref: to + '[]' };
        }

        return { ref: to };
    }

    const restSpec = resource.spec as RESTResourceSpec;

    Object.values(restSpec.methods).forEach((method) => {
        if (method.responseType) {
            method.responseType = maybeRenameEntity(method.responseType);
        }

        if (!method.arguments) {
            return;
        }

        const methodIds = Object.keys(method.arguments);

        methodIds.forEach((methodId) => {
            method.arguments![methodId] = maybeRenameEntity(method.arguments![methodId]);
        });
    });
}
