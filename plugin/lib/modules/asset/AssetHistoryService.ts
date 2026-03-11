import { onAsk } from "kuzzle-plugin-commons";
import { mCreateRequest } from "kuzzle-sdk";

import { DeviceManagerPlugin, InternalCollection } from "../plugin";
import { BaseService } from "../shared";

import { AskAssetHistoryAdd } from "./types/AssetEvents";
import {
  AssetHistoryContent,
  AssetHistoryEvent,
} from "./types/AssetHistoryContent";
import { KuzzleLogger } from "kuzzle-logger";

export class AssetHistoryService extends BaseService {
  readonly logger: KuzzleLogger;
  constructor(plugin: DeviceManagerPlugin, assetLogger: KuzzleLogger) {
    super(plugin);
    this.logger = assetLogger;
    onAsk<AskAssetHistoryAdd<AssetHistoryEvent>>(
      "ask:device-manager:asset:history:add",
      async ({ engineId, histories }) => this.add(engineId, histories),
    );
  }

  async add<TAssetHistoryEvent extends AssetHistoryEvent>(
    engineId: string,
    histories: AssetHistoryContent[],
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
      contents,
      { strict: true },
    );
  }
}
