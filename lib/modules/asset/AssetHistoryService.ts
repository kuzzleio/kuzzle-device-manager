import { KDocument, PluginContext } from "kuzzle";

import { DeviceManagerConfiguration, DeviceManagerPlugin, InternalCollection } from "../../core";
import { onAsk } from "../shared";

import { AssetHistoryContent, AssetHistoryEvent, AssetHistoryEventLink, AssetHistoryEventMeasure, AssetHistoryEventMetadata, AssetHistoryEventUnlink } from "./types/AssetHistoryContent";
import { AssetContent } from "./types/AssetContent";
import { AskAssetHistoryAdd } from "./types/AssetEvents";

export class AssetHistoryService {
  private context: PluginContext;
  private config: DeviceManagerConfiguration;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  constructor(plugin: DeviceManagerPlugin) {
    this.context = plugin.context;
    this.config = plugin.config;

    onAsk<AskAssetHistoryAdd<AssetHistoryEvent>>(
      "ask:device-manager:asset:history:add",
      async ({ engineId, event, asset }) => this.add(engineId, event, asset));
  }

  async add<TAssetHistoryEvent extends AssetHistoryEvent> (
    engineId: string,
    event: TAssetHistoryEvent,
    asset: KDocument<AssetContent>,
  ) {
    await this.sdk.document.create<AssetHistoryContent<TAssetHistoryEvent>>(
      engineId,
      InternalCollection.ASSETS_HISTORY,
      {
        type: "asset",
        event,
        id: asset._id,
        asset: asset._source
      });
  }

  async eventMeasure (
    engineId: string,
    asset: KDocument<AssetContent>,
    eventContent: AssetHistoryEventMeasure["measure"],
  ) {
    await this.sdk.document.create<AssetHistoryContent<AssetHistoryEventMeasure>>(
      engineId,
      InternalCollection.ASSETS_HISTORY,
      {
        type: "asset",
        event: {
          name: 'measure',
          measure: {
            names: eventContent.names,
          }
        },
        id: asset._id,
        asset: asset._source
      });
  }

  async eventMetadata (
    engineId: string,
    asset: KDocument<AssetContent>,
    eventContent: AssetHistoryEventMetadata["metadata"],
  ) {
    await this.sdk.document.create<AssetHistoryContent<AssetHistoryEventMetadata>>(
      engineId,
      InternalCollection.ASSETS_HISTORY,
      {
        type: "asset",
        event: {
          name: 'metadata',
          metadata: {
            names: eventContent.names,
          }
        },
        id: asset._id,
        asset: asset._source
      });
  }

  async eventLink (
    engineId: string,
    asset: KDocument<AssetContent>,
    eventContent: AssetHistoryEventLink["link"],
  ) {
    await this.sdk.document.create<AssetHistoryContent<AssetHistoryEventLink>>(
      engineId,
      InternalCollection.ASSETS_HISTORY,
      {
        type: "asset",
        event: {
          name: 'link',
          link: {
            deviceId: eventContent.deviceId,
          }
        },
        id: asset._id,
        asset: asset._source
      });
  }

  async eventUnlink (
    engineId: string,
    asset: KDocument<AssetContent>,
    eventContent: AssetHistoryEventUnlink["unlink"],
  ) {
    await this.sdk.document.create<AssetHistoryContent<AssetHistoryEventUnlink>>(
      engineId,
      InternalCollection.ASSETS_HISTORY,
      {
        type: "asset",
        event: {
          name: 'unlink',
          unlink: {
            deviceId: eventContent.deviceId,
          }
        },
        id: asset._id,
        asset: asset._source
      });
  }
}