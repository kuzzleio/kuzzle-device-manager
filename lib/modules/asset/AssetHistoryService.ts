import { PluginContext } from "kuzzle";
import { KDocument } from "kuzzle-sdk";

import {
  DeviceManagerConfiguration,
  DeviceManagerPlugin,
  InternalCollection,
} from "../../core";
import { onAsk } from "../shared";

import {
  AssetHistoryContent,
  AssetHistoryEvent,
} from "./types/AssetHistoryContent";
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
      async ({ engineId, event, asset }) => this.add(engineId, event, asset)
    );
  }

  async add<TAssetHistoryEvent extends AssetHistoryEvent>(
    engineId: string,
    event: TAssetHistoryEvent,
    asset: KDocument<AssetContent>
  ) {
    await this.sdk.document.create<AssetHistoryContent<TAssetHistoryEvent>>(
      engineId,
      InternalCollection.ASSETS_HISTORY,
      {
        asset: asset._source,
        event,
        id: asset._id,
      }
    );
  }
}
