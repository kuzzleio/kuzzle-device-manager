import { KDocument } from "kuzzle";

import { Asset } from "./Asset";
import { AssetContent } from "./types/AssetContent";

export class AssetSerializer {
  static id (model: string, reference: string) {
    return `${model}-${reference}`;
  }

  static serialize (asset: Asset): KDocument<AssetContent> {
    return {
      _id: asset._id,
      _source: asset._source,
    };
  }
}