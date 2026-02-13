import { KDocument } from "kuzzle-sdk";

import { AssetModelContent } from "../../model";
import { Metadata } from "../../shared";

import { AssetContent } from "./AssetContent";
import { AssetHistoryContent, AssetHistoryEvent } from "./AssetHistoryContent";

export type EventAssetUpdateBefore = {
  name: "device-manager:asset:update:before";

  args: [{ asset: KDocument<AssetContent>; metadata: Metadata }];
};

export type EventAssetUpdateAfter = {
  name: "device-manager:asset:update:after";

  args: [{ asset: KDocument<AssetContent>; metadata: Metadata }];
};

export type AskAssetRefreshModel = {
  name: "ask:device-manager:asset:refresh-model";

  payload: {
    assetModel: AssetModelContent;
  };

  result: void;
};

/**
 * @internal
 */
export type AskAssetHistoryAdd<TAssetHistoryEvent extends AssetHistoryEvent> = {
  name: "ask:device-manager:asset:history:add";

  payload: {
    engineId: string;
    histories: AssetHistoryContent<TAssetHistoryEvent>[];
  };

  result: void;
};
