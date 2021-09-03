import { EmbeddedSDK, JSONObject } from 'kuzzle';
import { BatchController } from './BatchController';

import { InstrumentablePromise } from './InstrumentablePromise';

/**
 * Map of index and collections with documents, options and associated promise
 */
type IndexBuffer = {
  [index: string]: {
    [collection: string]: {
      documents: Array<{_id: string, body: JSONObject}>,
      promise: InstrumentablePromise,
      options: JSONObject,
    }
  }
}

export class BatchBuffer {
  indexes: IndexBuffer = {};

  /**
   * Add a document to the buffer of a specific collection
   *
   * @param index Index name
   * @param collection Collection name
   * @param body Document content
   * @param _id Document ID
   * @param options Option object passed to the m* action
   *
   * @returns An object containing the index of the array of results and a promise resolving to the array of results
   */
  add (index: string, collection: string, body: JSONObject, _id: string = undefined, options?: JSONObject): { idx: number, promise: InstrumentablePromise } {
    if (! this.indexes[index]) {
      this.indexes[index] = {};
    }

    if (! this.indexes[index][collection]) {
      this.indexes[index][collection] = {
        documents: [],
        promise: new InstrumentablePromise(),
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

/**
 * This class handle buffers for every supported API action of the document controller:
 *  - create, update, createOrReplace, replace, get, exists, delete
 *
 * Each buffer is filled with documents to be write/get/delete into a collection.
 *
 * A timer will regularly execute the m* actions with the documents inside the buffers.
 *
 * If the interval is too big, buffers may contain too much documents for Kuzzle limits.
 * (e.g. "limits.documentsWriteCount" is 200 by default)
 */
export class BatchWriter {
  private timer: NodeJS.Timeout;
  private sdk: EmbeddedSDK;
  private interval: number;

  /**
   * Document Controller overload
   */
  document: BatchController;

  // Buffers
  buffers = {
    create: new BatchBuffer(),
    update: new BatchBuffer(),
    get: new BatchBuffer(),
    exists: new BatchBuffer(),
    delete: new BatchBuffer(),
    replace: new BatchBuffer(),
    createOrReplace: new BatchBuffer(),
  };

  /**
   * @param sdk Connected SDK
   * @param interval Timer interval in ms. Actions will be executed every {interval} ms
   */
  constructor (sdk: EmbeddedSDK, interval = 50) {
    this.sdk = sdk;
    this.interval = interval;

    this.document = new BatchController(this.sdk, this);
  }

  /**
   * Execute API actions with documents stored in the buffers.
   */
  async execute () {
    const buffers: JSONObject = {};

    // make a copy of the buffers
    for (const [name, buffer] of Object.entries(this.buffers)) {
      buffers[name] = buffer;
    }

    // prepare to enqueue documents in buffers
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

  /**
   * Initialize the buffers and start the timer
   */
  begin () {
    this.prepareRound()

    this.timer = setInterval(async () => {
      await this.execute();
    }, this.interval);
  }

  /**
   * Execute pending actions from the buffers and stop the timer.
   */
  async end () {
    await this.execute();

    clearInterval(this.timer);
  }

  /**
   * Reset all the buffers
   */
  private prepareRound () {
    for (const name of Object.keys(this.buffers)) {
      this.buffers[name] = new BatchBuffer();
    }
  }

  private async sendCreateBuffer (buffer: BatchBuffer, options?: { refresh?: 'wait_for' }) {
    const promises = [];

    for (const [index, collectionBuffer] of Object.entries(buffer.indexes)) {
      for (const [collection, { promise, documents }] of Object.entries(collectionBuffer)) {
        if (documents.length === 0) {
          promise.resolve();
          continue;
        }

        console.log(`CREATE ${index} ${collection} ${documents.length}`)

        promises.push(
          this.sdk.document.mCreate(index, collection, documents, { ...options, strict: true })
            .then(promise.resolve)
            .catch(promise.reject)
        );
      }
    }

    await Promise.all(promises)
  }

  private async sendUpdateBuffer (buffer: BatchBuffer, options?: { refresh?: 'wait_for' }) {
    const promises = [];

    for (const [index, collectionBuffer] of Object.entries(buffer.indexes)) {
      for (const [collection, { promise, documents }] of Object.entries(collectionBuffer)) {
        if (documents.length === 0) {
          promise.resolve();
          continue;
        }
        console.log(`UPDATE ${index} ${collection} ${documents.length}`)

        promises.push(
          this.sdk.document.mUpdate(index, collection, documents, { ...options })
            .then(promise.resolve)
            .catch(promise.reject)
        );
      }
    }

    await Promise.all(promises)
  }

  private async sendReplaceBuffer (buffer: BatchBuffer, options?: { refresh?: 'wait_for' }) {
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

  private async sendCreateOrReplaceBuffer (buffer: BatchBuffer, options?: { refresh?: 'wait_for' }) {
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

  private async sendGetBuffer (buffer: BatchBuffer) {
    const promises = [];

    for (const [index, collectionBuffer] of Object.entries(buffer.indexes)) {
      for (const [collection, { promise, documents }] of Object.entries(collectionBuffer)) {
        if (documents.length === 0) {
          promise.resolve();
          continue;
        }

        const ids = documents.map(({ _id }) => _id);
        console.log(`GET ${index} ${collection} ${ids.length}`)

        promises.push(
          this.sdk.document.mGet(index, collection, ids)
            .then(promise.resolve)
            .catch(promise.reject)
        );
      }
    }

    await Promise.all(promises)
  }

  private async sendExistsBuffer (buffer: BatchBuffer) {
    const promises = [];

    for (const [index, collectionBuffer] of Object.entries(buffer.indexes)) {
      for (const [collection, { promise, documents }] of Object.entries(collectionBuffer)) {
        if (documents.length === 0) {
          promise.resolve();
          continue;
        }

        const ids = documents.map(({ _id }) => _id);
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

  private async sendDeleteBuffer (buffer: BatchBuffer) {
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
}
