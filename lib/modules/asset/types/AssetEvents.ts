import { KDocument } from "kuzzle";

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

/**
 * @internal
 */
export type AskAssetHistoryAdd<TAssetHistoryEvent extends AssetHistoryEvent> = {
  name: "ask:device-manager:asset:history:add";

  payload: {
    engineId: string;
    event: TAssetHistoryEvent;
    asset: KDocument<AssetContent>;
  };

  result: void;
};
