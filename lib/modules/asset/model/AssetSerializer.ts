import { KDocument } from "kuzzle";

import { Asset } from "./Asset";
import { AssetContent, AssetDescription } from "../types/AssetContent";

export class AssetSerializer {
  static id (model: string, reference: string) {
    return `${model}-${reference}`;
  }

  static serialize (asset: Asset): KDocument<AssetContent> {
    if (!asset) {
      return undefined;
    }

    return {
      _id: asset._id,
      _source: asset._source,
    };
  }

  /**
   * Get asset description to contextualize measure data point
   */
  static description (asset: Asset): AssetDescription {
    if (! asset) {
      return undefined;
    }

    return {
      id: asset._id,
      model: asset._source.model,
      reference: asset._source.reference,
      metadata: asset._source.metadata,
    }
  }
}
