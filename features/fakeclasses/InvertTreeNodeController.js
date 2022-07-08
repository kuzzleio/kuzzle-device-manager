"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvertTreeNodeController = void 0;
const RelationalController_1 = require("../../lib/controllers/RelationalController");
class InvertTreeNodeController extends RelationalController_1.RelationalController {
    constructor(plugin) {
        console.log('-------------------- InvertTreeNodeController --------------------');
        console.log('InvertTreeNodeController plugin.context : ' + plugin.context);
        super(plugin, 'invertnode');
        this.definition = {
            actions: {
                create: {
                    handler: this.create.bind(this),
                    http: [{ path: 'device-manager/:engineId/invertTreeNode', verb: 'post' }],
                },
                delete: {
                    handler: this.delete.bind(this),
                    http: [{ path: 'device-manager/:engineId/invertTreeNode/:_id', verb: 'delete' }],
                },
                link: {
                    handler: this.link.bind(this),
                    http: [{ path: 'device-manager/:engineId/invertTreeNode/:_id/children/:_childrenId', verb: 'put' }],
                },
                unlink: {
                    handler: this.unlink.bind(this),
                    http: [{ path: 'device-manager/:engineId/invertTreeNode/:_id/children/:_childrenId', verb: 'delete' }],
                },
                update: {
                    handler: this.update.bind(this),
                    http: [{ path: 'device-manager/:engineId/invertTreeNode/:_id', verb: 'put' }],
                }
            },
        };
    }
    async create(request) {
        request.input.args._id = request.getBodyString('name');
        return super.create(request);
    }
    async update(request) {
        return super.genericUpdate(request, [], ['children']);
    }
    async delete(request) {
        //request.input.body = {};
        return super.genericDelete(request, [], ['children']);
    }
    async link(request) {
        const embedded = this.getFieldPath(request, 'children');
        const container = this.getFieldPath(request, 'parent', '_childrenId');
        return super.genericLink(request, embedded, container, false);
    }
    async unlink(request) {
        const embedded = this.getFieldPath(request, 'children');
        const container = this.getFieldPath(request, 'parent', '_childrenId');
        return super.genericUnlink(request, embedded, container, false);
    }
}
exports.InvertTreeNodeController = InvertTreeNodeController;
//# sourceMappingURL=InvertTreeNodeController.js.map