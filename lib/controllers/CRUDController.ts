import {
  KuzzleRequest,
  PluginContext,
  JSONObject,
  ControllerDefinition,
} from 'kuzzle';

import { NativeController } from 'kuzzle/lib/api/controllers/baseController.js'

export class CRUDController extends NativeController {
  [key: string]: any;

  protected context: PluginContext;
  protected config: JSONObject;
  private collection: string;
  public definition: ControllerDefinition;

  constructor (config: JSONObject, context: PluginContext, collection: string) {
    super();

    this.config = config;
    this.context = context;
    this.collection = collection;
  }

  /**
   * Create an asset or a sensor depending on the collection.
   *
   * @param request
   */
  create (request: KuzzleRequest) {
    const index = this.getIndex(request);
    const asset = this.getBody(request);
    const id = request.input.resource._id;

    return this.context.accessors.sdk.document.create(
      index,
      this.collection,
      asset,
      id,
      { ...request.input.args });
  }

  /**
   * Delete an asset or a sensor depending on the collection.
   *
   * @param request
   */
  async delete (request: KuzzleRequest) {
    const index = this.getIndex(request);
    const id = this.getId(request);

    return this.context.accessors.sdk.document.delete(
      index,
      this.collection,
      id,
      { ...request.input.args });
  }

  /**
   * search assets or sensors depending on the collection.
   *
   * @param request
   */
  search (request: KuzzleRequest) {
    const index = this.getIndex(request);
    const { searchBody } = this.getSearchParams(request);

    return this.context.accessors.sdk.document.search(
      index,
      this.collection,
      searchBody,
      { ...request.input.args });
  }

  /**
   * Create an asset or a sensor depending on the collection.
   *
   * @param request
   */
  update (request: KuzzleRequest) {
    const index = this.getIndex(request);
    const body = this.getBody(request);
    const id = this.getId(request);

    return this.context.accessors.sdk.document.update(
      index,
      this.collection,
      id,
      body,
      { ...request.input.args });
  }

}
