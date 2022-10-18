import { Asset } from "../Asset";
import { MetadataValue } from "./AssetContent";

export type EventAssetUpdateBefore = {
  name: 'device-manager:asset:update:before';

  args: [{ asset: Asset, metadata: MetadataValue }];
}

export type EventAssetUpdateAfter = {
  name: 'device-manager:asset:update:after';

  args: [{ asset: Asset, metadata: MetadataValue }];
}
