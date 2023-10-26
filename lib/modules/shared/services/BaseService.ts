import {
  ArgsDocumentControllerCreate,
  ArgsDocumentControllerDelete,
  ArgsDocumentControllerUpdate,
  Backend,
  EmbeddedSDK,
  EventGenericDocumentAfterDelete,
  EventGenericDocumentAfterUpdate,
  EventGenericDocumentAfterWrite,
  EventGenericDocumentBeforeDelete,
  EventGenericDocumentBeforeUpdate,
  EventGenericDocumentBeforeWrite,
  KDocument,
  KDocumentContent,
  KuzzleRequest,
  User,
} from "kuzzle";

import {
  DeviceManagerPlugin,
  DeviceManagerConfiguration,
  InternalCollection,
} from "../../plugin";

interface PayloadRequest {
  collection: InternalCollection;
  engineId: string;
}

export abstract class BaseService {
  constructor(private plugin: DeviceManagerPlugin) {}

  protected get app(): Backend {
    return global.app;
  }

  protected get sdk(): EmbeddedSDK {
    return this.plugin.context.accessors.sdk;
  }

  protected get config(): DeviceManagerConfiguration {
    return this.plugin.config;
  }

  protected get impersonatedSdk() {
    return (user: User) => {
      if (user?._id) {
        return this.sdk.as(user, { checkRights: false });
      }

      return this.sdk;
    };
  }

  /**
   * Wrapper to SDK create method with trigger generic:document events
   *
   * @param {KuzzleRequest} request
   * @param {KDocument} document
   * @param {PayloadRequest} payload
   * @param {ArgsDocumentControllerCreate} [options]
   * @returns {Promise<KDocument>}
   */
  protected async createDocument<T extends KDocumentContent = KDocumentContent>(
    request: KuzzleRequest,
    document: KDocument<T>,
    { engineId, collection }: PayloadRequest,
    options: ArgsDocumentControllerCreate = {}
  ): Promise<KDocument<T>> {
    const user = request.getUser();
    const refresh = request.getRefresh();

    request.input.args.collection = collection;
    const [modifiedDocument] = await this.app.trigger<
      EventGenericDocumentBeforeWrite<T>
    >("generic:document:beforeWrite", [document], request);

    const newDocument = await this.impersonatedSdk(user).document.create<T>(
      engineId,
      collection,
      modifiedDocument._source,
      modifiedDocument._id,
      { refresh, ...options }
    );
    const [endDocument] = await this.app.trigger<
      EventGenericDocumentAfterWrite<T>
    >("generic:document:afterWrite", [newDocument], request);

    return endDocument;
  }

  /**
   * Wrapper to SDK update method with trigger generic:document events
   *
   * @param {KuzzleRequest} request
   * @param {KDocument} document
   * @param {PayloadRequest} payload
   * @param {ArgsDocumentControllerUpdate} [options]
   * @returns {Promise<KDocument>}
   */
  protected async updateDocument<T extends KDocumentContent = KDocumentContent>(
    request: KuzzleRequest,
    document: KDocument<Partial<T>>,
    { engineId, collection }: PayloadRequest,
    options: ArgsDocumentControllerUpdate = {}
  ): Promise<KDocument<T>> {
    const user = request.getUser();
    const refresh = request.getRefresh();

    request.input.args.collection = collection;
    const [modifiedDocument] = await this.app.trigger<
      EventGenericDocumentBeforeUpdate<Partial<T>>
    >("generic:document:beforeUpdate", [document], request);

    const updatedDocument = await this.impersonatedSdk(user).document.update<T>(
      engineId,
      collection,
      modifiedDocument._id,
      modifiedDocument._source,
      { refresh, ...options }
    );

    const [endDocument] = await this.app.trigger<
      EventGenericDocumentAfterUpdate<T>
    >("generic:document:afterUpdate", [updatedDocument], request);

    return endDocument;
  }

  /**
   * Wrapper to SDK delete method with trigger generic:document events
   *
   * @param {KuzzleRequest} request
   * @param {string} documentId
   * @param {ArgsDocumentControllerUpdate} [options]
   * @returns {Promise<{ _id: string }>}
   */
  protected async deleteDocument(
    request: KuzzleRequest,
    documentId: string,
    { engineId, collection }: PayloadRequest,
    options: ArgsDocumentControllerDelete = {}
  ): Promise<{ _id: string }> {
    const user = request.getUser();
    const refresh = request.getRefresh();

    request.input.args.collection = collection;
    const [modifiedDocument] =
      await this.app.trigger<EventGenericDocumentBeforeDelete>(
        "generic:document:beforeDelete",
        [{ _id: documentId }],
        request
      );

    const deletedDocument = await this.impersonatedSdk(user).document.delete(
      engineId,
      collection,
      modifiedDocument._id,
      { refresh, ...options }
    );

    const [endDocument] =
      await this.app.trigger<EventGenericDocumentAfterDelete>(
        "generic:document:afterDelete",
        [{ _id: deletedDocument }],
        request
      );

    return endDocument;
  }
}
