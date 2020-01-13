import _ from "lodash";

import {
    isBuiltInType,
    SchemaEntity,
    SchemaEntryType,
    typeName,
    ResourceKind
} from "@blockware/ui-web-types";

import {RESTResourceMetadata, RESTResourceSpec} from "./types";

export const getCounterValue = (data: ResourceKind<RESTResourceSpec, RESTResourceMetadata>):number => {
    return _.size(data.spec.methods);
};

export const hasMethod = (data: ResourceKind<RESTResourceSpec, RESTResourceMetadata>, methodId: string):boolean => {
    return !!data.spec.methods[methodId];
};

export const validate = (resource: ResourceKind<RESTResourceSpec, RESTResourceMetadata>, entities:SchemaEntity[]):string[] => {
    const errors:string[] = [];
    let entityNames = resolveEntities(resource);

    const missingEntities = entityNames.filter((entityName) => {
        return !entities.find((entity) => entity.name === entityName);
    });

    if (missingEntities.length > 0) {
        errors.push('One or more entities are missing: ' + missingEntities.join(', '));
    }

    _.forEach(resource.spec.methods, (method, methodId) => {
        if (!method.path) {
            errors.push(`${methodId} is missing path`);
        }

        if (!method.method) {
            errors.push(`${methodId} is missing HTTP method`);
        }

        if (!method.arguments) {
            return;
        }

        const invalidArguments = Object.values(method.arguments).filter((argument) => {
            if (!argument.type) {
                return true;
            }

            return !argument.transport;
        });

        if (invalidArguments.length > 0) {
            errors.push(`${methodId} has invalid arguments`);
        }

    });

    return errors;
};

export function resolveEntities(resource: ResourceKind<RESTResourceSpec, RESTResourceMetadata>):string[] {

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
    }

    if (!resource.spec.methods) {
        return out;
    }

    Object.values(resource.spec.methods).forEach((method) => {
        maybeAddEntity(method.responseType);

        if (!method.arguments) {
            return;
        }

        Object.values(method.arguments).forEach((arg) => {
            maybeAddEntity(arg.type);
        });
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