import { mCreateRequest } from "kuzzle-sdk";

import { DeviceManagerPlugin, InternalCollection } from "../plugin";
import { onAsk, BaseService } from "../shared";

import { AskAssetHistoryAdd } from "./types/AssetEvents";
import {
  AssetHistoryContent,
  AssetHistoryEvent,
} from "./types/AssetHistoryContent";

export class AssetHistoryService extends BaseService {
  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);

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
