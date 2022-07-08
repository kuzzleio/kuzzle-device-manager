"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeNodeController = void 0;
const RelationalController_1 = require("../../lib/controllers/RelationalController");
class TreeNodeController extends RelationalController_1.RelationalController {
    constructor(plugin) {
        console.log('-------------------- TreeNodeController --------------------');
        console.log('TreeNodeController plugin.context : ' + plugin.context);
        super(plugin, 'node');
        this.definition = {
            actions: {
                create: {
                    handler: this.create.bind(this),
                    http: [{ path: 'device-manager/:engineId/treeNode', verb: 'post' }],
                },
                delete: {
                    handler: this.delete.bind(this),
                    http: [{ path: 'device-manager/:engineId/treeNode/:_id', verb: 'delete' }],
                },
                link: {
                    handler: this.link.bind(this),
                    http: [{ path: 'device-manager/:engineId/treeNode/:_id/parent/:_parentId', verb: 'put' }],
                },
                unlink: {
                    handler: this.unlink.bind(this),
                    http: [{ path: 'device-manager/:engineId/treeNode/:_id/parent/:_parentId', verb: 'delete' }],
                },
                update: {
                    handler: this.update.bind(this),
                    http: [{ path: 'device-manager/:engineId/treeNode/:_id', verb: 'put' }],
                }
            },
        };
    }
    async create(request) {
        request.input.args._id = request.getBodyString('name');
        request.input.body.children = [];
        request.input.body.parent = [];
        return super.create(request);
    }
    async update(request) {
        return super.genericUpdate(request, ['parent']);
    }
    async delete(request) {
        //request.input.body = {};
        return super.genericDelete(request, ['parent']);
    }
    async link(request) {
        const embedded = this.getFieldPath(request, 'parent');
        const container = this.getFieldPath(request, 'children', '_parentId');
        return super.genericLink(request, embedded, container, true);
    }
    async unlink(request) {
        const embedded = this.getFieldPath(request, 'parent');
        const container = this.getFieldPath(request, 'children', '_parentId');
        return super.genericUnlink(request, embedded, container, true);
    }
}
exports.TreeNodeController = TreeNodeController;
//# sourceMappingURL=TreeNodeController.js.map