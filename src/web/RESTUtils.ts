/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { ResourceWithSpec } from '@kapeta/ui-web-types';

import { RESTKindContext, RESTMethodContext, RESTResource, RESTResourceSpec } from './types';

import {
    DSLAPI,
    DSLAPIParser,
    DSLController,
    DSLConverters,
    DSLData,
    DSLEntity,
    DSLEntityType,
    DSLMethod,
    DSLReferenceResolver,
    DSLTypeHelper,
    EntityHelpers,
    HTTP_METHODS,
    isVoid,
    KAPLANG_ID,
    KAPLANG_VERSION,
    KaplangWriter,
    REST_ARGUMENT,
    RESTMethodReader,
} from '@kapeta/kaplang-core';
import { createId, DSLControllerMethod } from './mapping/types';
import isSameType = EntityHelpers.isSameType;
import toComparisonType = EntityHelpers.toComparisonType;

export const getCounterValue = (data: ResourceWithSpec<RESTResourceSpec>): number => {
    if (!data.spec.methods) {
        return 0;
    }
    return Object.keys(data.spec.methods).length;
};

export const hasMethod = (data: ResourceWithSpec<RESTResourceSpec>, methodId: string): boolean => {
    return Boolean(data.spec.methods && methodId in data.spec.methods);
};

export function validateApiName(fieldName: string, name: string) {
    if (!name) {
        return;
    }

    if (!/^[a-zA-Z_$][a-zA-Z\d_$]*$/.test(name)) {
        throw new Error('Invalid API name');
    }
}

const validateMethod = (method: DSLMethod): string[] => {
    const errors: string[] = [];
    const reader = new RESTMethodReader(method);
    if (!reader.name) {
        errors.push('Method is missing a name. Add a name to solve this issue');
        return errors;
    }

    const methodAnnotation = reader.getAnnotation(HTTP_METHODS);

    if (!methodAnnotation) {
        errors.push(`${reader.name} is missing a HTTP method. Add a HTTP method to solve this issue`);
        return errors;
    }

    reader.parameters.some((parameter) => {
        if (isVoid(parameter.type)) {
            errors.push(
                `${reader.name} is missing a type for the parameter ${parameter.name}. Add a type to solve this issue`
            );
            return true;
        }

        const transportAnnotation = parameter.getAnnotation(REST_ARGUMENT);
        if (!transportAnnotation) {
            errors.push(
                `${reader.name} is missing transport for the parameter ${parameter.name}. Add a transport to solve this issue`
            );
            return true;
        }
        return false;
    });

    return errors;
};

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

    const restSpec = context.resource.spec;

    if (!restSpec.source?.value) {
        return errors;
    }

    const result = DSLAPIParser.parse(restSpec.source.value, {
        rest: true,
        validTypes: entityNames,
        ignoreSemantics: true,
    });

    result.forEach((entity) => {
        if (entity.type === DSLEntityType.METHOD) {
            errors.push(...validateMethod(entity));
            return;
        }

        if (entity.type !== DSLEntityType.CONTROLLER) {
            return;
        }

        if (!entity.name) {
            errors.push('Controller is missing a name. Add a name to solve this issue');
        }

        if (!entity.path) {
            errors.push('Controller is missing a path. Add a path to solve this issue');
        }

        if (!entity.methods) {
            return;
        }

        const invalidMethodIds = entity.methods
            .filter((method) => {
                const methodErrors = validateMethod(method);
                if (methodErrors.length > 0) {
                    errors.push(...methodErrors);
                    return true;
                }
                return false;
            })
            .map((method) => createId(entity.name, method.name));

        if (invalidMethodIds.length > 0) {
            errors.push(
                `${
                    entity.name
                } is missing a return type and/or a transport for the following methods: ${invalidMethodIds.join(
                    ', '
                )}. Add return type and transport to all methods to solve this issue.`
            );
        }
    });

    return errors;
};

export function resolveEntitiesFromMethod(context: RESTMethodContext): string[] {
    return resolveEntityNames([context.method]);
}

export class RESTResourceEditor {
    private resource: RESTResource;
    private entities: DSLEntity[];

    constructor(resource: RESTResource) {
        this.resource = resource;
        this.entities = [];

        if (resource.spec?.source?.value) {
            this.entities = DSLAPIParser.parse(resource.spec.source.value, {
                rest: true,
                ignoreSemantics: true,
            });
        }
    }

    private parseId(id: string): [string | null, string] {
        return id.includes('::') ? (id.split('::') as [string, string]) : [null, id];
    }

    public setMethod(id: string, updatedMethod: DSLMethod) {
        const [namespace, methodName] = this.parseId(id);

        let controller = (namespace ? this.entities.find((controller) => {
            return controller.type === DSLEntityType.CONTROLLER && controller.name.toLowerCase() === namespace.toLowerCase();
        }) : undefined) as DSLController | undefined;

        let targetList: DSLEntity[] = this.entities;

        if (!controller && namespace) {
            controller = {
                type: DSLEntityType.CONTROLLER,
                name: namespace,
                path: '/',
                methods: [],
            };
            this.entities.push(controller);
        }

        if (controller) {
            targetList = controller.methods;
        }

        const methodIndex = targetList.findIndex((method) => {
            return method.type === DSLEntityType.METHOD && method.name === methodName;
        });

        if (methodIndex === -1) {
            targetList.push(updatedMethod);
        } else {
            targetList.splice(methodIndex, 1, updatedMethod);
        }

        this.write();
    }

    public deleteMethod(id: string) {
        const [namespace, methodName] = this.parseId(id);

        const removalFilter = (method: DSLEntity) => {
            return method.type === DSLEntityType.METHOD && method.name !== methodName;
        };

        if (namespace) {
            // Delete method from controller
            let controller = this.entities.find((controller) => {
                return controller.type === DSLEntityType.CONTROLLER && controller.name === namespace;
            }) as DSLController | undefined;

            if (!controller) {
                return;
            }
            controller.methods = controller.methods.filter(removalFilter);
            if (controller.methods.length < 1) {
                // Delete controller if it has no methods
                this.entities = this.entities.filter((entity) => {
                    return entity !== controller
                });
            }
        } else {
            // Delete method from top level
            this.entities = this.entities.filter(removalFilter);
        }

        this.write();
    }

    public renameEntity(from: string, to: string) {
        const resolver = new DSLReferenceResolver();
        resolver.visitReferences(this.entities, (name) => {
            const type = DSLTypeHelper.asType(name);
            if (type.name === from) {
                type.name = to;
                return type;
            }
            return name;
        });
        this.write();
    }

    public toData() {
        return this.resource;
    }

    private write() {
        this.resource.spec = {
            ...this.resource.spec,
            source: {
                type: KAPLANG_ID,
                version: KAPLANG_VERSION,
                value: KaplangWriter.write(this.entities),
            },
            methods: DSLConverters.toSchemaMethods(
                this.entities.filter((entity) => {
                    return entity.type === DSLEntityType.METHOD || entity.type === DSLEntityType.CONTROLLER;
                }) as DSLAPI[]
            ),
        };
    }
}

export function parseMethodsFromResource(resource: RESTResource): DSLControllerMethod[] {
    if (!resource.spec?.source?.value) {
        return [];
    }

    const entities = DSLAPIParser.parse(resource.spec.source.value, {
        rest: true,
        ignoreSemantics: true,
    });

    return entities.flatMap((entity) => {
        if (entity.type === DSLEntityType.METHOD) {
            return [entity];
        }

        if (entity.type !== DSLEntityType.CONTROLLER) {
            return [];
        }

        return entity.methods.map((method) => {
            return {
                ...method,
                namespace: entity.name,
            } satisfies DSLControllerMethod;
        });
    });
}

export function resolveEntityNames(result: DSLEntity[]) {
    const resolver = new DSLReferenceResolver();

    const dataTypes = resolver.resolveReferences(result);

    return dataTypes.filter((dataType) => {
        return !DSLTypeHelper.isBuiltInType(dataType);
    });
}

export function toTypeNames(types: DSLData[]) {
    return types.map((dataType) => {
        return DSLConverters.fromDSLType(dataType);
    });
}

export function resolveEntities(context: RESTKindContext) {
    const restSpec = context.resource.spec;
    if (!restSpec.source?.value) {
        return [];
    }

    const result = DSLAPIParser.parse(restSpec.source.value, {
        rest: true,
        validTypes: toTypeNames(context.entities),
        ignoreSemantics: true,
    });

    return resolveEntityNames(result);
}

export function renameEntityReferences(resource: ResourceWithSpec<RESTResourceSpec>, from: string, to: string): void {
    const editor = new RESTResourceEditor(resource);
    editor.renameEntity(from, to);
}
