import {
  PluginContext,
  KuzzleRequest,
  PreconditionError
} from '../../../kuzzle';
import { NativeController } from '../../../kuzzle/lib/api/controller/base.js'

export class CRUDService {
  private context: PluginContext;
  private controllerContext: NativeController;
  private collection: string;

  constructor(context: PluginContext, controllerContext: NativeController, collection: string) {
    this.collection = collection;

    this.context = context;
    this.controllerContext = controllerContext;
  }

  async create(request: KuzzleRequest) {
    const index = this.controllerContext.getIndex(request);
    const asset = this.controllerContext.getBody(request);
    const id = this.controllerContext.getId(request);

    const res = await this.context.accessors.sdk.document.create(
      index,
      this.collection,
      asset,
      id,
      {
        refresh: this.controllerContext.getRefresh(request)
      }
    );

    return res;
  }

  async delete(request: KuzzleRequest) {
    const index = this.controllerContext.getIndex(request);
    const id = this.controllerContext.getId(request);

    const entity = await this.context.accessors.sdk.document.get(
      index,
      this.collection,
      id
    );
    if (entity._source.assetId || entity._source.sensorId) {
      throw new PreconditionError(`${id} is linked to ${entity._source.assetId || entity._source.sensorId}.`);
    }

    const res = await this.context.accessors.sdk.document.delete(
      index,
      this.collection,
      id,
      {
        refresh: this.controllerContext.getRefresh(request)
      }
    );

    return res;
  }

  async list(request: KuzzleRequest) {
    const index = this.controllerContext.getIndex(request);
    const searchParams = this.controllerContext.getSearchParams(request);

    const res = await this.context.accessors.sdk.document.search(
      index,
      this.collection,
      searchParams.searchBody
    );

    return res;
  }
}