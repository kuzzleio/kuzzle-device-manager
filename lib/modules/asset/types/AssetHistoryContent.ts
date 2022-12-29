import { JSONObject, KDocumentContent } from "kuzzle";

import { Metadata } from "../../shared";
import { AssetContent } from "./AssetContent";

/**
 * Asset History document content
 */
export interface AssetHistoryContent<
  TMeasures extends JSONObject = any,
  TMetadata extends Metadata = any
> extends KDocumentContent {
  /**
   * Type of the history document
   *
   * (reserved for futur use)
   */
  type: string;

  /**
   * ID of the historized asset
   */
  id: string;

  /**
   * Name of the changes who caused the historization
   *
   *  - `measure` a new measure has been received
   *  - `metadata` the asset metadata has been updated
   *  - `link` a device has been linked or unlinked to the asset
   */
  events: Array<'measure' | 'metadata' | 'link'>;

  asset: AssetContent<TMeasures, TMetadata>;
}
