import {
  ArgsDocumentControllerCreate,
  Backend,
  EmbeddedSDK,
  EventGenericDocumentAfterWrite,
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
}
