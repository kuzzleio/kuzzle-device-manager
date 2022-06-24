import { FieldPath, RelationalController } from '../../../lib/controllers/RelationalController';
import { KuzzleRequest, Plugin } from 'kuzzle';

export class TreeNodeController extends RelationalController {
  constructor (plugin: Plugin) {
    super(plugin, 'treeNode');
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
          http: [{ path: 'device-manager/:engineId/treeNode/:_id/parent/_parenId', verb: 'put' }],
        },
        unlink: {
          handler: this.unlink.bind(this),
          http: [{ path: 'device-manager/:engineId/treeNode/:_id/parent/_parenId', verb: 'delete' }],
        },
        update: {
          handler: this.update.bind(this),
          http: [{ path: 'device-manager/:engineId/treeNode/:_id', verb: 'put' }],
        }
      },
    };
  }

  async create (request: KuzzleRequest) {
    request.input.args.id = request.getBodyString('name');
    return super.create(request);
  }

  async update (request: KuzzleRequest) {
    return super.genericUpdate(request, ['children']);
  }

  async delete (request: KuzzleRequest) {
    request.input.args.id = request.getString('name');
    return super.genericDelete(request, ['children']);
  }

  async link (request: KuzzleRequest) {
    request.input.args.id = request.getString('name');
    const embedded = this.getFieldPath(request, 'children');
    const container = this.getFieldPath(request, 'parent');
    return super.genericLink(request, embedded, container, true);
  }

  async unlink (request: KuzzleRequest) {
    const embedded = this.getFieldPath(request, 'children');
    const container = this.getFieldPath(request, 'parent', '_parenId');
    return super.genericLink(request, embedded, container, true);
  }

}