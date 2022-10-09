import _ from "lodash";

import {
    isBuiltInType,
    SchemaEntity,
    SchemaEntryType,
    typeName,
    ResourceKind, isList, isDTO, TypedValue
} from "@blockware/ui-web-types";

import {
    convertToRestMethod,
    RESTKindContext,
    RESTMethodContext, RESTMethodEdit,
    RESTMethodEditContext,
    RESTResourceMetadata,
    RESTResourceSpec
} from "./types";

import {DSL_LANGUAGE_ID, DSLConverters, DSLWriter} from "@blockware/ui-web-components";

export const getCounterValue = (data: ResourceKind<RESTResourceSpec, RESTResourceMetadata>):number => {
    return _.size(data.spec.methods);
};

export const hasMethod = (data: ResourceKind<RESTResourceSpec, RESTResourceMetadata>, methodId: string):boolean => {
    return methodId in data.spec.methods;
};

export const validate = (context:RESTKindContext):string[] => {
    const errors:string[] = [];
    let entityNames = resolveEntities(context);

    const missingEntities = entityNames.filter((entityName) => {
        return !context.entities.some((entity) => entity.name === entityName);
    });

    if (missingEntities.length > 0) {
        errors.push('One or more entities are missing: ' + missingEntities.join(', '));
    }

    _.forEach(context.resource.spec.methods, (method, methodId) => {
        if (!method.path) {
            errors.push(`${methodId} is missing path`);
        }

        if (!method.method) {
            errors.push(`${methodId} is missing HTTP method`);
        }

        if (!method.arguments) {
            return;
        }

        const invalidArguments = Object.entries(method.arguments).filter(([methodId, argument]) => {
            if (!argument.type) {
                return true;
            }

            return !argument.transport;
        }).map(([methodId, argument]) => methodId);

        if (invalidArguments.length > 0) {
            errors.push(`${methodId} has invalid arguments: ${invalidArguments.join(', ')}`);
        }

    });

    return errors;
};

export function resolveEntitiesFromEntity(entity: SchemaEntity, entities:SchemaEntity[]):SchemaEntity[] {
    if (!isDTO(entity)) {
        return [];
    }

    const out:string[] = [];

    Object.values(entity.properties).forEach(property => {
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

        const subEntity = entities.find(e => e.name === name);

        if (subEntity) {
            const subEntityEntities = resolveEntitiesFromEntity(subEntity, entities);
            subEntityEntities.forEach(e => {
                if (out.indexOf(e.name) === -1) {
                    out.push(e.name);
                }
            })
        }
    })

    return out.map(name =>
        entities.find(e => e.name === name)
    ).filter(e => !!e) as SchemaEntity[];
}

export function resolveEntitiesFromMethod(context: RESTMethodContext|RESTMethodEditContext):string[] {
    const out:string[] = [];

    function maybeAddEntity(type?:SchemaEntryType) {
        if (!type ||
            isBuiltInType(type)) {
            return;
        }

        const entityName = typeName(type);
        if (out.indexOf(entityName) === -1) {
            out.push(entityName);
        }

        const entity = context.entities.find(e => e.name === entityName);
        if (entity) {
            const subEntities = resolveEntitiesFromEntity(entity, context.entities);
            subEntities.forEach(subEntity => {
                if (out.indexOf(subEntity.name) === -1) {
                    out.push(subEntity.name);
                }
            })
        }
    }

    maybeAddEntity(context.method.responseType);

    if (context.method.arguments) {
        Object.values(context.method.arguments).forEach((arg) => {
            maybeAddEntity(arg.type);
        });
    }

    return out;
}

export function setRESTMethod(spec: RESTResourceSpec, id:string, method: RESTMethodEdit) {
    spec.methods[id] = convertToRestMethod(method);
    spec.source = convertRESTToDSLSource(spec);
}

export function deleteRESTMethod(spec: RESTResourceSpec, id:string) {
    delete spec.methods[id];
    spec.source = convertRESTToDSLSource(spec);
}

export function convertRESTToDSLSource(spec: RESTResourceSpec): TypedValue {
    let dslMethods = DSLConverters.fromSchemaMethods(spec.methods);
    return {
        type: DSL_LANGUAGE_ID,
        value: DSLWriter.write(dslMethods)
    }
}


export function resolveEntities(context:RESTKindContext):string[] {

    const out:string[] = [];

    if (!context.resource.spec.methods) {
        return out;
    }

    Object.values(context.resource.spec.methods).forEach((method) => {
        const usedEntities = resolveEntitiesFromMethod({method, entities: context.entities});

        usedEntities.forEach(entity => {
            if (out.indexOf(entity) === -1) {
                out.push(entity);
            }
        })
    });

    return out;
}

export function renameEntityReferences(resource: ResourceKind<RESTResourceSpec, RESTResourceMetadata>, from:string, to:string):void {

    function maybeRenameEntity(type:SchemaEntryType):SchemaEntryType {
        if (isBuiltInType(type)) {
            return type;
        }

        if (typeName(type) !== from) {
            return type;
        }

        if (isList(type)) {
            return {$ref:to + '[]'};
        }

        return {$ref:to};
    }

    Object.values(resource.spec.methods).forEach((method) => {
        if (method.responseType) {
            method.responseType = maybeRenameEntity(method.responseType);
        }

        if (!method.arguments) {
            return;
        }

        Object.values(method.arguments).forEach((arg) => {
            arg.type = maybeRenameEntity(arg.type);
        });
    });

}