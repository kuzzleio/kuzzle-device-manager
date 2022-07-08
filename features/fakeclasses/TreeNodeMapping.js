"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeNodeMappings = void 0;
const fieldpathMappings_1 = require("../../lib/mappings/fieldpathMappings");
exports.TreeNodeMappings = {
    dynamic: 'strict',
    properties: {
        children: {
            dynamic: 'true',
            properties: {}
        },
        name: {
            type: 'keyword'
        },
        parent: fieldpathMappings_1.fieldPathMappings
    }
};
//# sourceMappingURL=TreeNodeMapping.js.map