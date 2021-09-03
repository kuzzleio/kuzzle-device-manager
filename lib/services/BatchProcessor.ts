import { BadRequestError, DocumentController, EmbeddedSDK, JSONObject, NotFoundError } from 'kuzzle';

class AdvancedPromise {
  promise: Promise<any>;
  resolve: (...any) => any;
  reject: (...any) => any;

  constructor () {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

/**
 * Map of collection names and document to be written
 */
type CollectionBuffer = {
  [collection: string]: {
    documents: Array<{_id: string, body: JSONObject}>,
    promise: AdvancedPromise,
    options: JSONObject,
  }
};

/**
 * Map of index names and CollectionBuffer
 */
type IndexBuffer = {
  [index: string]: CollectionBuffer
}

class Buffer {
  indexes: IndexBuffer = {};

  add (index: string, collection: string, body: JSONObject, _id: string = undefined, options?: JSONObject): { idx: number, promise: AdvancedPromise } {
    if (! this.indexes[index]) {
      this.indexes[index] = {};
    }

    if (! this.indexes[index][collection]) {
      this.indexes[index][collection] = {
        documents: [],
        promise: new AdvancedPromise(),
        options,
      };
    }

    const idx = this.indexes[index][collection].documents.length;

    this.indexes[index][collection].options = { ...this.indexes[index][collection].options, ...options };

    this.indexes[index][collection].documents.push({
      _id,
      body
    });

    return {
      idx,
      promise: this.indexes[index][collection].promise,
    };
  }
}

export class BatchDocumentController extends DocumentController {
  batchProcessor: BatchProcessor;

  constructor (sdk: EmbeddedSDK, batchProcessor: BatchProcessor) {
    super(sdk);

    this.batchProcessor = batchProcessor;
  }

  async create (index: string, collection: string, content: JSONObject, _id?: string, options?: JSONObject) {
    const { idx, promise } = this.batchProcessor.buffers.create.add(index, collection, content, _id, options);

    const { successes } = await promise.promise;

    return successes[idx];
  }

  async replace (index: string, collection: string, _id: string, content: JSONObject, options?: JSONObject) {
    const { idx, promise } = this.batchProcessor.buffers.replace.add(index, collection, content, _id, options);

    const { successes, errors } = await promise.promise;

    const error = errors.find(({ _id: id }) => id === _id);

    if (error) {
      throw new BadRequestError(`Cannot replace document "${_id}": ${error}`);
    }

    return successes[idx];
  }

  async createOrReplace (index: string, collection: string, _id: string, content: JSONObject, options?: JSONObject) {
    const { idx, promise } = this.batchProcessor.buffers.createOrReplace.add(index, collection, content, _id, options);

    const { successes, errors } = await promise.promise;

    const error = errors.find(({ _id: id }) => id === _id);

    if (error) {
      throw new BadRequestError(`Cannot create or replace document "${_id}": ${error}`);
    }

    return successes[idx];
  }

  async update (index: string, collection: string, _id: string, changes: JSONObject, options?: JSONObject) {
    const { idx, promise } = this.batchProcessor.buffers.update.add(index, collection, changes, _id, options);

    const { successes, errors } = await promise.promise;

    const error = errors.find(({ _id: id }) => id === _id);

    if (error) {
      throw new BadRequestError(`Cannot update document "${_id}": ${error}`);
    }

    return successes[idx];
  }

  async get (index: string, collection: string, id: string) {
    const { promise } = this.batchProcessor.buffers.get.add(index, collection, undefined, id);

    const { successes } = await promise.promise;

    const document = successes.find(({ _id }) => _id === id);

    if (! document) {
      throw new NotFoundError(`Document ${id} not found`, 'services.storage.not_found');
    }

    return document;
  }

  async exists (index: string, collection: string, id: string) {
    const { idx, promise } = this.batchProcessor.buffers.exists.add(index, collection, undefined, id);

    const { successes } = await promise.promise;

    return successes[idx];
  }

  async delete (index: string, collection: string, id: string) {
    const { idx, promise } = this.batchProcessor.buffers.delete.add(index, collection, undefined, id);

    const { successes, errors } = await promise.promise;

    const error = errors.find(({ _id }) => _id === id);

    if (error) {
      throw new NotFoundError(`Cannot delete document ${id}: ${error}`);
    }

    return successes[idx];
  }
}

export class BatchProcessor {
  private timer: NodeJS.Timeout;
  private sdk: EmbeddedSDK;
  private interval: number;

  // Buffers
  buffers = {
    create: new Buffer(),
    update: new Buffer(),
    get: new Buffer(),
    exists: new Buffer(),
    delete: new Buffer(),
    replace: new Buffer(),
    createOrReplace: new Buffer(),
  };

  constructor (sdk: EmbeddedSDK, interval: number) {
    this.sdk = sdk;
    this.interval = interval;
  }

  async execute () {
    const buffers: JSONObject = {};
    for (const [name, buffer] of Object.entries(this.buffers)) {
      buffers[name] = buffer;
    }

    this.prepareRound();

    await Promise.all([
      this.sendCreateBuffer(buffers.create),
      this.sendUpdateBuffer(buffers.update),
      this.sendCreateOrReplaceBuffer(buffers.createOrReplace),
      this.sendDeleteBuffer(buffers.delete),
      this.sendExistsBuffer(buffers.exists),
      this.sendGetBuffer(buffers.get),
      this.sendReplaceBuffer(buffers.replace),
    ])
  }

  private async sendCreateBuffer (buffer: Buffer, options?: { refresh?: 'wait_for' }) {
    const promises = [];

    for (const [index, collectionBuffer] of Object.entries(buffer.indexes)) {
      for (const [collection, { promise, documents }] of Object.entries(collectionBuffer)) {
        if (documents.length === 0) {
          promise.resolve();
          continue;
        }

        // console.log(`CREATE ${index} ${collection} ${documents.length}`)

        promises.push(
          this.sdk.document.mCreate(index, collection, documents, { ...options, strict: true })
            .then(promise.resolve)
            .catch(promise.reject)
        );
      }
    }

    await Promise.all(promises)
  }

  private async sendUpdateBuffer (buffer: Buffer, options?: { refresh?: 'wait_for' }) {
    const promises = [];

    for (const [index, collectionBuffer] of Object.entries(buffer.indexes)) {
      for (const [collection, { promise, documents }] of Object.entries(collectionBuffer)) {
        if (documents.length === 0) {
          promise.resolve();
          continue;
        }
        // console.log(`UPDATE ${index} ${collection} ${documents.length}`)

        promises.push(
          this.sdk.document.mUpdate(index, collection, documents, { ...options })
            .then(promise.resolve)
            .catch(promise.reject)
        );
      }
    }

    await Promise.all(promises)
  }

  private async sendReplaceBuffer (buffer: Buffer, options?: { refresh?: 'wait_for' }) {
    const promises = [];

    for (const [index, collectionBuffer] of Object.entries(buffer.indexes)) {
      for (const [collection, { promise, documents }] of Object.entries(collectionBuffer)) {
        if (documents.length === 0) {
          promise.resolve();
          continue;
        }

        promises.push(
          this.sdk.document.mReplace(index, collection, documents, { ...options })
            .then(promise.resolve)
            .catch(promise.reject)
        );
      }
    }

    await Promise.all(promises)
  }

  private async sendCreateOrReplaceBuffer (buffer: Buffer, options?: { refresh?: 'wait_for' }) {
    const promises = [];

    for (const [index, collectionBuffer] of Object.entries(buffer.indexes)) {
      for (const [collection, { promise, documents }] of Object.entries(collectionBuffer)) {
        if (documents.length === 0) {
          promise.resolve();
          continue;
        }

        promises.push(
          this.sdk.document.mCreateOrReplace(index, collection, documents, { ...options })
            .then(promise.resolve)
            .catch(promise.reject)
        );
      }
    }

    await Promise.all(promises)
  }

  private async sendGetBuffer (buffer: Buffer) {
    const promises = [];

    for (const [index, collectionBuffer] of Object.entries(buffer.indexes)) {
      for (const [collection, { promise, documents }] of Object.entries(collectionBuffer)) {
        if (documents.length === 0) {
          promise.resolve();
          continue;
        }

        const ids = documents.map(({ _id }) => _id);
        // console.log(`GET ${index} ${collection} ${ids.length}`)

        promises.push(
          this.sdk.document.mGet(index, collection, ids)
            .then(promise.resolve)
            .catch(promise.reject)
        );
      }
    }

    await Promise.all(promises)
  }

  private async sendExistsBuffer (buffer: Buffer) {
    const promises = [];

    for (const [index, collectionBuffer] of Object.entries(buffer.indexes)) {
      for (const [collection, { promise, documents }] of Object.entries(collectionBuffer)) {
        if (documents.length === 0) {
          promise.resolve();
          continue;
        }

        const ids = documents.map(({ _id }) => _id);
        // console.log(`EXISTS ${index} ${collection} ${ids.length}`)
        promises.push(
          this.sdk.document.mGet(index, collection, ids)
            .then(({ successes }) => {
              const successesId = successes.map(({ _id }) => _id);
              const exists = new Array(ids.length);

              for (let i = 0; i < exists.length; i++) {
                exists[i] = successesId.includes(ids[i]);
              }

              promise.resolve({ successes: exists });
            })
            .catch(promise.reject)
        );
      }
    }

    await Promise.all(promises)
  }

  private async sendDeleteBuffer (buffer: Buffer) {
    const promises = [];

    for (const [index, collectionBuffer] of Object.entries(buffer.indexes)) {
      for (const [collection, { promise, documents }] of Object.entries(collectionBuffer)) {
        if (documents.length === 0) {
          promise.resolve();
          continue;
        }

        const ids = documents.map(({ _id }) => _id);

        promises.push(
          this.sdk.document.mDelete(index, collection, ids)
            .then(promise.resolve)
            .catch(promise.reject)
        );
      }
    }

    await Promise.all(promises)
  }

  private prepareRound () {
    for (const name of Object.keys(this.buffers)) {
      this.buffers[name] = new Buffer();
    }
  }

  begin () {
    this.prepareRound()

    this.timer = setInterval(async () => {
      await this.execute();
    }, this.interval);
  }

  end () {
    clearInterval(this.timer);
  }
}
