import { KDocument } from "kuzzle-sdk";

import { Metadata } from "../../../modules/shared";

import { AssetContent } from "./AssetContent";

export type EventAssetUpdateBefore = {
  name: "device-manager:asset:update:before";

  args: [{ asset: KDocument<AssetContent>; metadata: Metadata }];
};

export type EventAssetUpdateAfter = {
  name: "device-manager:asset:update:after";

  args: [{ asset: KDocument<AssetContent>; metadata: Metadata }];
};
