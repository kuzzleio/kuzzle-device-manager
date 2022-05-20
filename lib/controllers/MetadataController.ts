import { KuzzleRequest, Plugin } from 'kuzzle';
import { RelationalController } from './RelationalController';

export class MetadataController extends RelationalController {
  constructor (plugin: Plugin) {
    super(plugin, 'metadata');
    RelationalController.classMap.set('metadata', this);

    /* eslint-disable sort-keys */
    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ path: 'device-manager/:engineId/metadata', verb: 'post' }],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [{ path: 'device-manager/:engineId/metadata/:_id', verb: 'delete' }],
        },
        update: {
          handler: this.update.bind(this),
          http: [{ path: 'device-manager/:engineId/metadata/:_id', verb: 'put' }],
        }
      },
    };
  }

  async create (request: KuzzleRequest) {
    request.input.body.AssetCategory = [];
    request.input.args._id = request.input.body.name;
    if (! request.input.body.mandatory) {
      request.input.body.mandatory = false;
    }
    return super.create(request);
  }

  async update (request: KuzzleRequest) {
    return super.genericUpdate(request, ['AssetCategory']);
  }

  async delete (request: KuzzleRequest) {
    return super.genericDelete(request, ['AssetCategory']);
  }
}