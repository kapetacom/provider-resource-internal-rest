"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RESTEditorComponent_1 = require("./RESTEditorComponent");
var RESTUtils_1 = require("./RESTUtils");
exports.RESTAPIConfig = {
    componentType: RESTEditorComponent_1.default,
    getCounterValue: RESTUtils_1.getCounterValue,
    resolveEntities: RESTUtils_1.resolveEntities,
    renameEntityReferences: RESTUtils_1.renameEntityReferences,
    hasMethod: RESTUtils_1.hasMethod,
    validate: RESTUtils_1.validate
};
