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

  protected normalizeKuzzleRequest(
    request: KuzzleRequest,
    { collection, engineId }: PayloadRequest
  ) {
    request.input.args.collection = collection;
    request.input.args.index = engineId;

    return request;
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
    { collection, engineId }: PayloadRequest,
    options: ArgsDocumentControllerCreate = {}
  ): Promise<KDocument<T>> {
    const kuzzleRequest = this.normalizeKuzzleRequest(request, {
      collection,
      engineId,
    });
    const refresh = kuzzleRequest.getRefresh();

    const [{ _id }] = await this.app.trigger<EventGenericDocumentBeforeGet>(
      "generic:document:beforeGet",
      [{ _id: documentId }],
      kuzzleRequest
    );

    const newDocument = await this.sdk.document.get<T>(
      engineId,
      collection,
      _id,
      { refresh, ...options }
    );

    const [endDocument] = await this.app.trigger<
      EventGenericDocumentAfterGet<T>
    >("generic:document:afterGet", [newDocument], kuzzleRequest);

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
    { collection, engineId }: PayloadRequest,
    options: ArgsDocumentControllerCreate = {}
  ): Promise<KDocument<T>> {
    const kuzzleRequest = this.normalizeKuzzleRequest(request, {
      collection,
      engineId,
    });
    const user = kuzzleRequest.getUser();
    const refresh = kuzzleRequest.getRefresh();

    const [modifiedDocument] = await this.app.trigger<
      EventGenericDocumentBeforeWrite<T>
    >("generic:document:beforeWrite", [document], kuzzleRequest);

    const newDocument = await this.impersonatedSdk(user).document.create<T>(
      engineId,
      collection,
      modifiedDocument._source,
      modifiedDocument._id,
      { refresh, ...options }
    );
    const [endDocument] = await this.app.trigger<
      EventGenericDocumentAfterWrite<T>
    >("generic:document:afterWrite", [newDocument], kuzzleRequest);

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
    { collection, engineId }: PayloadRequest,
    options: ArgsDocumentControllerUpdate = {}
  ): Promise<KDocument<T>> {
    const kuzzleRequest = this.normalizeKuzzleRequest(request, {
      collection,
      engineId,
    });
    const user = kuzzleRequest.getUser();
    const refresh = kuzzleRequest.getRefresh();

    const [modifiedDocument] = await this.app.trigger<
      EventGenericDocumentBeforeUpdate<Partial<T>>
    >("generic:document:beforeUpdate", [document], kuzzleRequest);

    const updatedDocument = await this.impersonatedSdk(user).document.update<T>(
      engineId,
      collection,
      modifiedDocument._id,
      modifiedDocument._source,
      { refresh, ...options }
    );

    const [endDocument] = await this.app.trigger<
      EventGenericDocumentAfterUpdate<T>
    >("generic:document:afterUpdate", [updatedDocument], kuzzleRequest);

    return endDocument;
  }

  /**
   * Wrapper to SDK delete method with trigger generic:document events
   *
   * @param {KuzzleRequest} request
   * @param {string} documentId
   * @param {PayloadRequest} payload
   * @param {ArgsDocumentControllerUpdate} [options]
   * @returns {Promise<{ _id: string }>}
   */
  protected async deleteDocument(
    request: KuzzleRequest,
    documentId: string,
    { collection, engineId }: PayloadRequest,
    options: ArgsDocumentControllerDelete = {}
  ): Promise<{ _id: string }> {
    const kuzzleRequest = this.normalizeKuzzleRequest(request, {
      collection,
      engineId,
    });
    const user = kuzzleRequest.getUser();
    const refresh = kuzzleRequest.getRefresh();

    const [modifiedDocument] =
      await this.app.trigger<EventGenericDocumentBeforeDelete>(
        "generic:document:beforeDelete",
        [{ _id: documentId }],
        kuzzleRequest
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
        kuzzleRequest
      );

    return endDocument;
  }

  /**
   * Wrapper to SDK search method with trigger generic:document events
   * ! Caution the pipes are not applied on next()
   *
   * @param {KuzzleRequest} request
   * @param {ArgsDocumentControllerUpdate} [options]
   * @param {PayloadRequest} payload
   * @returns {Promise<SearchResult<KHit>>}
   */
  protected async searchDocument<T extends KDocumentContent = KDocumentContent>(
    request: KuzzleRequest,
    { from, size, scrollTTL: scroll }: SearchParams,
    { collection, engineId }: PayloadRequest
  ): Promise<SearchResult<KHit<T>>> {
    const kuzzleRequest = this.normalizeKuzzleRequest(request, {
      collection,
      engineId,
    });
    const {
      protocol,
      misc: { verb = "POST" },
    } = kuzzleRequest.context.connection;

    const lang = kuzzleRequest.getLangParam();
    const searchBody = kuzzleRequest.getSearchBody();

    const modifiedBody =
      await this.app.trigger<EventGenericDocumentBeforeSearch>(
        "generic:document:beforeSearch",
        searchBody,
        kuzzleRequest
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
