import { Metadata } from "../../../modules/shared";

import { Asset } from "../model/Asset";

export type EventAssetUpdateBefore = {
  name: "device-manager:asset:update:before";

  args: [{ asset: Asset; metadata: Metadata }];
};

export type EventAssetUpdateAfter = {
  name: "device-manager:asset:update:after";

  args: [{ asset: Asset; metadata: Metadata }];
};
