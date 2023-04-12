import {MappingHandler} from "./MappingHandler";
import {
    convertAllToEditMethods,
    isCompatibleRESTMethods,
    RESTKindContext,
    RESTMethodEdit,
    RESTResource
} from "../types";
import {
    createEqualMapping,
    createSourceOnlyMapping,
    createTargetOnlyMapping,
    MappedMethod,
    MappingHandlerContext,
    RESTMethodMappingEdit
} from "./types";
import {
    determineEntityIssues,
    getCompatibleMethodsAndEntities,
    getEntitiesToBeAddedForCopy,
    mappedMethodSorter
} from "./MappingUtils";
import _ from "lodash";
import {ConnectionMethodMappingType, ConnectionMethodsMapping} from "@kapeta/ui-web-types";
import {setRESTMethod} from "../RESTUtils";

export interface BuildResultError {
    title:string
    message:string
}

export interface BuildResult extends MappingHandlerContext {
    handler: MappingHandler
}


export class MappingHandlerBuilder {
    private readonly sourceContext:RESTKindContext;
    private readonly targetContext:RESTKindContext;
    private readonly mappedMethods: MappedMethod[] = [];
    private readonly mappedTargets: RESTMethodEdit[] = [];
    private readonly mappedSources: RESTMethodEdit[] = [];

    private sourceMethods:RESTMethodEdit[] = [];
    private targetMethods:RESTMethodMappingEdit[] = [];

    private context:MappingHandlerContext = {
        clientWasEmpty: false,
        serverWasEmpty: false,
        sourceName: '',
        targetName: '',
        issues: [],
        warnings: []
    };


    constructor(sourceContext:RESTKindContext, targetContext:RESTKindContext) {
        this.sourceContext = sourceContext;
        this.targetContext = targetContext;
    }

    private isValidValue(value?: ConnectionMethodsMapping):boolean {
        return !!(value && !_.isEmpty(value));
    }

    public build(value?: ConnectionMethodsMapping): BuildResult {
        this.context.sourceName = this.sourceContext.resource.metadata.name;
        this.context.targetName = this.targetContext.resource.metadata.name;
        this.sourceMethods = convertAllToEditMethods(this.sourceContext.resource);
        this.targetMethods = convertAllToEditMethods(this.targetContext.resource);
        this.context.issues = determineEntityIssues(this.sourceContext, this.targetContext);

        const validValue = this.isValidValue(value);
        if (validValue) {
            this.readFromValue(value);
        } else {
            this.copyMethodsAndEntitiesToPeer();
        }

        this.handleSourceMethods(validValue);
        this.handleTargetMethods();

        this.mappedMethods.sort(mappedMethodSorter);

        const handler = new MappingHandler(this.mappedMethods, this.sourceContext, this.targetContext);

        return {
            ...this.context,
            handler
        }
    }

    private handleTargetMethods() {
        this.targetMethods.forEach((targetMethod) => {
            if (this.mappedTargets.indexOf(targetMethod) > -1) {
                return;
            }

            this.mappedMethods.push(createTargetOnlyMapping(targetMethod));
        });
    }

    private handleSourceMethods(validValue:boolean) {
        this.sourceMethods.forEach((sourceMethod) => {
            if (this.mappedSources.indexOf(sourceMethod) > -1) {
                return;
            }

            this.mappedSources.push(sourceMethod);

            if (!validValue) {
                //If there is no valid value, we try to auto-map as much as possible
                for (let i = 0; i < this.targetMethods.length; i++) {
                    let targetMethod = this.targetMethods[i];

                    if (this.mappedTargets.indexOf(targetMethod) > -1) {
                        continue;
                    }

                    const {
                        issues,
                        entitiesToBeAdded
                    } = getEntitiesToBeAddedForCopy(
                        {method: sourceMethod, entities: this.sourceContext.entities},
                        {method: targetMethod, entities: this.targetContext.entities}
                    )

                    if (issues.length === 0) {
                        this.mappedTargets.push(targetMethod);
                        this.targetContext.entities.push(...entitiesToBeAdded);
                        this.mappedMethods.push(createEqualMapping(sourceMethod, targetMethod));
                        return;
                    }
                }
            }

            //No matching target found
            this.mappedMethods.push(createSourceOnlyMapping(sourceMethod));

        });
    }

    private copyMethodsAndEntitiesToPeer() {
        //If target or source methods are empty we assume it is a new connection and mapping - and copy everything
        if (this.targetMethods.length === 0) {
            let {
                compatibleMethods,
                compatibleEntities
            } = getCompatibleMethodsAndEntities(this.sourceMethods, this.sourceContext, this.targetContext);

            if (compatibleMethods.length > 0) {
                this.targetContext.entities.push(...compatibleEntities);
                this.targetMethods.push(...compatibleMethods);
                compatibleMethods.forEach(method => {
                    setRESTMethod(this.targetContext.resource.spec, method.id, method);
                });
            }

            this.context.targetName = this.context.sourceName;
            this.context.clientWasEmpty = true;
        } else if (this.sourceMethods.length === 0) {
            let {
                compatibleMethods,
                compatibleEntities
            } = getCompatibleMethodsAndEntities(this.targetMethods, this.targetContext, this.sourceContext);

            if (compatibleMethods.length > 0) {
                this.sourceContext.entities.push(...compatibleEntities);
                this.sourceMethods.push(...compatibleMethods);
                //Also add to the spec
                compatibleMethods.forEach(method => {
                    setRESTMethod(this.sourceContext.resource.spec, method.id, method);
                });
            }

            this.context.sourceName = this.context.targetName;
            this.context.serverWasEmpty = true;
        }
    }

    private readFromValue(value?: ConnectionMethodsMapping) {
        const hasValue = this.isValidValue(value);
        if (value && hasValue) {
            Object.entries(value)
                .forEach(([sourceMethodId, mapping]) => {
                    const sourceMethod = this.sourceMethods.find(m => m.id === sourceMethodId);

                    if (!sourceMethod) {
                        this.context.warnings.push(`Mapped method ${sourceMethodId} did not exist and was removed.`);
                        return;
                    }

                    const targetMethod = this.targetMethods.find(m => m.id === mapping.targetId);
                    if (!targetMethod) {
                        this.context.warnings.push(`Mapped method ${mapping.targetId} did not exist and was removed.`);
                        return;
                    }

                    this.mappedTargets.push(targetMethod);
                    this.mappedSources.push(sourceMethod);

                    const isCompatible = isCompatibleRESTMethods(
                        {method:sourceMethod, entities: this.sourceContext.entities},
                        {method:targetMethod, entities: this.targetContext.entities}
                    );

                    if (!isCompatible) {
                        //Something changed and methods are no longer compatible
                        this.context.warnings.push(`Mapping for ${this.context.sourceName}.${sourceMethodId} and ${this.context.targetName}.${mapping.targetId} was invalid and was removed.`);

                        this.mappedMethods.push(
                            createSourceOnlyMapping(sourceMethod),
                            createTargetOnlyMapping(targetMethod)
                        );
                        return;
                    }

                    switch (mapping.type) {
                        case ConnectionMethodMappingType.EXACT: //Only exact mapping supported right now
                            this.mappedMethods.push(createEqualMapping(sourceMethod, targetMethod));
                            break;
                    }
                });
        }
    }
}