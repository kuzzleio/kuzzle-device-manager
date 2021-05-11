import {
  KuzzleRequest,
  PluginContext,
  JSONObject,
  ControllerDefinition,
} from 'kuzzle';

export class CRUDController {
  protected context: PluginContext;
  protected config: JSONObject;
  private collection: string;
  public definition: ControllerDefinition;

  constructor (config: JSONObject, context: PluginContext, collection: string) {
    this.config = config;
    this.context = context;
    this.collection = collection;
  }

  get as () {
    return user => this.context.accessors.sdk.as(user, { checkRights: true });
  }

  /**
   * Create an asset or a device depending on the collection.
   *
   * @param request
   */
  async create (request: KuzzleRequest) {
    const index = request.getIndex();
    const asset = request.getBody();
    const id = request.input.resource._id;

    return this.as(request.context.user).document.create(
      index,
      this.collection,
      asset,
      id,
      { ...request.input.args });
  }

  /**
   * Delete an asset or a device depending on the collection.
   *
   * @param request
   */
  async delete (request: KuzzleRequest) {
    const index = request.getIndex();
    const id = request.getId();

    return this.as(request.context.user).document.delete(
      index,
      this.collection,
      id,
      { ...request.input.args });
  }

  /**
   * search assets or devices depending on the collection.
   *
   * @param request
   */
  async search (request: KuzzleRequest) {
    const index = request.getIndex();
    const { searchBody } = request.getSearchParams();

    return this.as(request.context.user).query(
      {
        controller: 'document',
        action: 'search',
        index,
        collection: this.collection,
        body: searchBody,
        ...request.input.args
      }
    );
  }

  /**
   * Create an asset or a device depending on the collection.
   *
   * @param request
   */
  async update (request: KuzzleRequest) {
    const index = request.getIndex();
    const body = request.getBody();
    const id = request.getId();

    return this.as(request.context.user).document.update(
      index,
      this.collection,
      id,
      body,
      { ...request.input.args });
  }
}
