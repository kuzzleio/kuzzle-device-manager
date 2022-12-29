import { KDocument, PluginContext } from "kuzzle";

import { DeviceManagerConfiguration, DeviceManagerPlugin, InternalCollection } from "../../core";
import { onAsk } from "../shared";

import { AssetHistoryContent } from "./types/AssetHistoryContent";
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

    onAsk<AskAssetHistoryAdd>(
      "ask:device-manager:asset:history:add",
      async ({ engineId, events, asset }) => this.add(engineId, events, asset));
  }

  async add (
    engineId: string,
    events: AssetHistoryContent["events"],
    asset: KDocument<AssetContent>
  ) {
    await this.sdk.document.create<AssetHistoryContent>(
      engineId,
      InternalCollection.ASSETS_HISTORY,
      {
        type: "asset",
        events,
        id: asset._id,
        asset: asset._source
      });
  }
}