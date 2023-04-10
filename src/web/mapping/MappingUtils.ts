import {
    getCompatibleRESTMethodsIssues, isCompatibleRESTMethods, RESTMethodEdit, RESTMethodEditContext
} from "../types";

import type {
    RESTKindContext
} from "../types";

import {resolveEntities, resolveEntitiesFromMethod} from "../RESTUtils";
import {MappedMethod, RESTMethodMappingEdit} from "./types";
import {Entity, getSchemaEntityCompatibilityIssues, isSchemaEntityCompatible } from "@kapeta/schemas";

/**
 * Determines conflicts between entities of source and target
 * @param source
 * @param target
 */
export function determineEntityIssues(source: RESTKindContext, target: RESTKindContext): string[] {
    const sourceEntityNames = resolveEntities(source);
    const targetEntityNames = resolveEntities(target);
    const entityIssues: string[] = [];
    const handled: string[] = [];
    sourceEntityNames.forEach(sourceEntityName => {
        const sourceEntity = source.entities.find(e => e.name === sourceEntityName);
        const targetEntity = target.entities.find(e => e.name === sourceEntityName);
        handled.push(sourceEntityName);
        if (!sourceEntity) {
            entityIssues.push(`Missing source entity: ${sourceEntityName}`);
            return;
        }
        if (!targetEntity) {
            //Not a problem - we can add it
            return;
        }

        const issues = getSchemaEntityCompatibilityIssues(sourceEntity, targetEntity, source.entities, target.entities);
        entityIssues.push(...issues.map(i => {
            return `${i} for type: ${sourceEntityName}`
        }));
    });

    targetEntityNames.forEach(targetEntityName => {
        if (handled.indexOf(targetEntityName) > -1) {
            return;
        }

        const sourceEntity = source.entities.find(e => e.name === targetEntityName);
        const targetEntity = target.entities.find(e => e.name === targetEntityName);
        if (!targetEntity) {
            entityIssues.push(`Missing target entity: ${targetEntityName}`);
            return;
        }

        if (!sourceEntity) {
            //Not a problem - we can add it
            return;
        }

        const issues = getSchemaEntityCompatibilityIssues(sourceEntity, targetEntity, source.entities, target.entities);
        entityIssues.push(...issues.map(i => {
            return `${i} for type: ${targetEntityName}`
        }));
    });

    return entityIssues;
}

export const mappedMethodSorter = (a:MappedMethod, b:MappedMethod) => {
    if (a.mapped !== b.mapped) {
        return a.mapped ? -1 : 1;
    }

    if (a.source && b.source) {
        if (a.source.copyOf && b.source.copyOf) {
            return 0;
        }

        return 1;
    }

    if (!a.source && b.source) {
        return -1;
    }

    return 0;
}

export function getCompatibleMethodsAndEntities(methods:RESTMethodEdit[], aContext:RESTKindContext, bContext:RESTKindContext) {
    const compatibleEntities = getCompatibleEntities(aContext, bContext);
    const compatibleMethods: RESTMethodMappingEdit[] = [];

    methods.forEach(sourceMethod => {
        const sourceMethodContext = {method: sourceMethod, entities: aContext.entities};
        const targetMethodContext = {
            method: sourceMethod,
            entities: [...bContext.entities, ...compatibleEntities]
        };
        //Check if the methods are compatible
        if (isCompatibleRESTMethods(sourceMethodContext, targetMethodContext)) {
            compatibleMethods.push({...sourceMethod, copyOf: sourceMethod});
        }
    })

    return {
        compatibleMethods,
        compatibleEntities
    }
}

export function getCompatibleEntities(aContext:RESTKindContext, bContext:RESTKindContext):Entity[] {
    const entityList = resolveEntities(aContext);
    const {
        entitiesToBeAdded
    } = getCompatibleEntitiesForList(entityList, aContext.entities, bContext.entities);

    return entitiesToBeAdded;
}

export function copyMethods(methods: RESTMethodEdit[]):RESTMethodMappingEdit[] {
    return methods.map((sourceMethod) => {
        return {...sourceMethod, copyOf: sourceMethod};
    });
}

/**
 * Gets all entities that can and should be added from one entity list (aEntities) to another (bEntities)
 */
export function getCompatibleEntitiesForList(entityNames: string[], aEntities: Entity[], bEntities: Entity[]) {
    const issues: string[] = [];
    let entitiesToBeAdded: Entity[] = [];
    entityNames.forEach(entityNAme => {
        const bEntity = bEntities.find(e => e.name === entityNAme);
        const aEntity = aEntities.find(e => e.name === entityNAme);
        if (!bEntity) {
            if (aEntity) {
                entitiesToBeAdded.push(aEntity);
            }
        } else if (aEntity) {
            const entityIssues = getSchemaEntityCompatibilityIssues(aEntity, bEntity, aEntities, bEntities);
            issues.push(...entityIssues.map(issue => {
                return `${issue} for type: ${entityNAme}`
            }));
        }
    });

    entitiesToBeAdded = entitiesToBeAdded.filter(newEntity => {
        //We do this to make sure any sub types are available
        return isSchemaEntityCompatible(newEntity,newEntity,aEntities, [...bEntities, ...entitiesToBeAdded] )
    });

    return {issues, entitiesToBeAdded };
}

/**
 * Gets all the entities in use by a method that needs to be added to the bEntities to be able to copy method
 *
 */
export function getEntitiesToBeAddedForCopy(aContext: RESTMethodEditContext, bContext: RESTMethodEditContext) {
    const usedEntityNames = resolveEntitiesFromMethod(aContext);

    const {
        issues,
        entitiesToBeAdded
    } = getCompatibleEntitiesForList(usedEntityNames, aContext.entities, bContext.entities);

    if (issues.length === 0) {
        issues.push(...getCompatibleRESTMethodsIssues(aContext, {
            method: bContext.method,
            entities: [...bContext.entities, ...entitiesToBeAdded]
        }));
    }

    return {issues, entitiesToBeAdded: issues.length === 0 ? entitiesToBeAdded : []};
}
