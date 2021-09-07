import {
  BadRequestError,
  DocumentController,
  EmbeddedSDK,
  JSONObject,
  NotFoundError
} from 'kuzzle';

import { BatchWriter } from './BatchWriter';

/**
 * Overload of the document controller.
 *
 * This class replace the following methods and will execute them by batch using
 * m* actions:
 *  - create
 *  - replace
 *  - createOrReplace
 *  - update
 *  - get
 *  - exists
 *  - delete
 *
 * The m* actions returns the successes in the same order as in the request so
 * since we have the index of the single document inside the array of documents
 * sent to the action, we can retrieve the corresponding result in the array of
 * results.
 *
 */
export class BatchController extends DocumentController {
  writer: BatchWriter;

  constructor (sdk: EmbeddedSDK, writer: BatchWriter) {
    super(sdk);

    this.writer = writer;
  }

  async create (index: string, collection: string, content: JSONObject, _id?: string, options?: JSONObject) {
    const { idx, promise } = this.writer.addCreate(index, collection, content, _id, options);

    const { successes } = await promise.promise;

    return successes[idx];
  }

  async replace (index: string, collection: string, _id: string, content: JSONObject, options?: JSONObject) {
    const { idx, promise } = this.writer.addReplace(index, collection, content, _id, options);

    const { successes, errors } = await promise.promise;

    const error = errors.find(({ _id: id }) => id === _id);

    if (error) {
      throw new BadRequestError(`Cannot replace document "${_id}": ${error}`);
    }

    return successes[idx];
  }

  async createOrReplace (index: string, collection: string, _id: string, content: JSONObject, options?: JSONObject) {
    const { idx, promise } = this.writer.addCreateOrReplace(index, collection, content, _id, options);

    const { successes, errors } = await promise.promise;

    const error = errors.find(({ _id: id }) => id === _id);

    if (error) {
      throw new BadRequestError(`Cannot create or replace document "${_id}": ${error}`);
    }

    return successes[idx];
  }

  async update (index: string, collection: string, _id: string, changes: JSONObject, options?: JSONObject) {
    const { idx, promise } = this.writer.addUpdate(index, collection, changes, _id, options);

    const { successes, errors } = await promise.promise;

    const error = errors.find(({ _id: id }) => id === _id);

    if (error) {
      throw new BadRequestError(`Cannot update document "${_id}": ${error}`);
    }

    return successes[idx];
  }

  async get (index: string, collection: string, id: string) {
    const { promise } = this.writer.addGet(index, collection, undefined, id);

    const { successes } = await promise.promise;

    const document = successes.find(({ _id }) => _id === id);

    if (! document) {
      throw new NotFoundError(`Document ${id} not found`, 'services.storage.not_found');
    }

    return document;
  }

  async exists (index: string, collection: string, id: string) {
    const { idx, promise } = this.writer.addExists(index, collection, undefined, id);

    const { successes } = await promise.promise;

    return successes[idx];
  }

  async delete (index: string, collection: string, id: string) {
    const { idx, promise } = this.writer.addDelete(index, collection, undefined, id);

    const { successes, errors } = await promise.promise;

    const error = errors.find(({ _id }) => _id === id);

    if (error) {
      throw new NotFoundError(`Cannot delete document ${id}: ${error}`);
    }

    return successes[idx];
  }
}
