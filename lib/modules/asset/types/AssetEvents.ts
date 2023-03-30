import { KDocument } from "kuzzle-sdk";
import { AssetModelContent } from "lib/modules/model";

import { Metadata } from "../../../modules/shared";

import { AssetContent } from "./AssetContent";
import { AssetHistoryEvent } from "./AssetHistoryContent";

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
    event: TAssetHistoryEvent;
    asset: KDocument<AssetContent>;
    timestamp: number;
  };

  result: void;
};
