import {
  ArgsDocumentControllerCreate,
  ArgsDocumentControllerDelete,
  ArgsDocumentControllerUpdate,
  Backend,
  BaseRequest,
  DocumentSearchResult,
  EmbeddedSDK,
  EventGenericDocumentAfterDelete,
  EventGenericDocumentAfterGet,
  EventGenericDocumentAfterUpdate,
  EventGenericDocumentAfterWrite,
  EventGenericDocumentBeforeDelete,
  EventGenericDocumentBeforeGet,
  EventGenericDocumentBeforeUpdate,
  EventGenericDocumentBeforeWrite,
  KDocument,
  KDocumentContent,
  KHit,
  KuzzleRequest,
  SearchResult,
  User,
} from "kuzzle";

import {
  DeviceManagerPlugin,
  DeviceManagerConfiguration,
  InternalCollection,
  EventGenericDocumentBeforeSearch,
  EventGenericDocumentAfterSearch,
  SearchQueryResult,
} from "../../plugin";

interface PayloadRequest {
  collection: InternalCollection;
  engineId: string;
}

export type SearchParams = ReturnType<KuzzleRequest["getSearchParams"]>;

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
   * @param {KDocument} documentId
   * @param {PayloadRequest} payload
   * @param {ArgsDocumentControllerCreate} [options]
   * @returns {Promise<KDocument>}
   */
  protected async getDocument<T extends KDocumentContent = KDocumentContent>(
    request: KuzzleRequest,
    documentId: string,
    { engineId, collection }: PayloadRequest,
    options: ArgsDocumentControllerCreate = {}
  ): Promise<KDocument<T>> {
    const refresh = request.getRefresh();

    request.input.args.collection = collection;
    const [{ _id }] = await this.app.trigger<EventGenericDocumentBeforeGet>(
      "generic:document:beforeGet",
      [{ _id: documentId }],
      request
    );

    const newDocument = await this.sdk.document.get<T>(
      engineId,
      collection,
      _id,
      { refresh, ...options }
    );

    const [endDocument] = await this.app.trigger<
      EventGenericDocumentAfterGet<T>
    >("generic:document:afterGet", [newDocument], request);

    return endDocument;
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

  /**
   * Wrapper to SDK search method with trigger generic:document events
   * ! Caution the pipes are not applied on next()
   *
   * @param {KuzzleRequest} request
   * @param {string} documentId
   * @param {ArgsDocumentControllerUpdate} [options]
   * @returns {Promise<{ _id: string }>}
   */
  protected async searchDocument<T extends KDocumentContent = KDocumentContent>(
    request: KuzzleRequest,
    { from, size, scrollTTL: scroll }: SearchParams,
    { engineId, collection }: PayloadRequest
  ): Promise<SearchResult<KHit<T>>> {
    const {
      protocol,
      misc: { verb = "POST" },
    } = request.context.connection;

    const lang = request.getLangParam();
    const searchBody = request.getSearchBody();

    request.input.args.collection = collection;
    const modifiedBody =
      await this.app.trigger<EventGenericDocumentBeforeSearch>(
        "generic:document:beforeSearch",
        searchBody,
        request
      );

    const query = {
      action: "search",
      body: null,
      collection,
      controller: "document",
      from,
      index: engineId,
      lang,
      scroll,
      searchBody: null,
      size,
      verb,
    };

    if (protocol === "http" && verb === "GET") {
      query.searchBody = modifiedBody;
    } else {
      query.body = modifiedBody;
    }

    const { result } = await this.sdk.query<BaseRequest, SearchQueryResult<T>>(
      query
    );

    const modifiedResult = await this.app.trigger<
      EventGenericDocumentAfterSearch<T>
    >("generic:document:afterSearch", result, request);

    return new DocumentSearchResult(global, query, {}, modifiedResult);
  }
}
