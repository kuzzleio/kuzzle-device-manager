import { PluginContext } from "kuzzle";
import { mCreateRequest } from "kuzzle-sdk";

import {
  DeviceManagerConfiguration,
  DeviceManagerPlugin,
  InternalCollection,
} from "../plugin";
import { onAsk } from "../shared";

import { AskAssetHistoryAdd } from "./types/AssetEvents";
import {
  AssetHistoryContent,
  AssetHistoryEvent,
} from "./types/AssetHistoryContent";

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
      async ({ engineId, histories }) => this.add(engineId, histories)
    );
  }

  async add<TAssetHistoryEvent extends AssetHistoryEvent>(
    engineId: string,
    histories: AssetHistoryContent[]
  ) {
    const contents: mCreateRequest<
      AssetHistoryContent<TAssetHistoryEvent, any, any>
    > = [];

    for (const { asset, event, id, timestamp } of histories) {
      contents.push({
        body: {
          asset,
          event,
          id,
          timestamp,
        },
      });
    }

    await this.sdk.document.mCreate<AssetHistoryContent<TAssetHistoryEvent>>(
      engineId,
      InternalCollection.ASSETS_HISTORY,
      contents
    );
  }
}
