"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvertTreeNodeMappings = void 0;
const fieldpathMappings_1 = require("../../lib/mappings/fieldpathMappings");
exports.InvertTreeNodeMappings = {
    dynamic: 'strict',
    properties: {
        children: fieldpathMappings_1.fieldPathMappings,
        name: {
            type: 'keyword'
        },
        parent: {
            dynamic: 'true',
            properties: {}
        }
    }
};
//# sourceMappingURL=InvertTreeNodeMapping.js.map