import {
  KuzzleRequest,
  PluginContext,
  ControllerDefinition,
  Plugin,
} from 'kuzzle';
import { DeviceManagerConfig } from '../DeviceManagerPlugin';

export class CRUDController {
  protected context: PluginContext;
  protected config: DeviceManagerConfig;
  private collection: string;
  public definition: ControllerDefinition;

  constructor (plugin: Plugin, collection: string) {
    this.config = plugin.config as any;
    this.context = plugin.context;
    this.collection = collection;
  }

  get as () {
    return user => this.context.accessors.sdk.as(user, { checkRights: true });
  }

  /**
   * Create an document or a device depending on the collection.
   *
   * @param request
   */
  async create (request: KuzzleRequest) {
    const index = request.getIndex();
    const document = request.getBody();
    const id = request.input.args._id;

    return this.as(request.context.user).document.create(
      index,
      this.collection,
      document,
      id,
      { ...request.input.args });
  }

  /**
   * Delete an document or a device depending on the collection.
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
   * search documents or devices depending on the collection.
   *
   * @param request
   */
  async search (request: KuzzleRequest) {
    const index = request.getIndex();
    const { searchBody } = request.getSearchParams();

    const res = await this.as(request.context.user).query(
      {
        controller: 'document',
        action: 'search',
        index,
        collection: this.collection,
        body: searchBody,
        ...request.input.args
      }
    );

    return res.result
  }

  /**
   * Create a document or a device depending on the collection.
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
