import { JSONObject, KDocumentContent } from "kuzzle";

import { Metadata } from "../../shared";

import { AssetContent } from "./AssetContent";

export type AssetHistoryEventMeasure = {
  name: "measure";
  measure: {
    names: string[];
  };
};

export type AssetHistoryEventMetadata = {
  name: "metadata";
  metadata: {
    names: string[];
  };
};

export type AssetHistoryEventLink = {
  name: "link";
  link: {
    deviceId: string;
  };
};

export type AssetHistoryEventUnlink = {
  name: "unlink";
  unlink: {
    deviceId: string;
  };
};

export type AssetHistoryEvent =
  | AssetHistoryEventMeasure
  | AssetHistoryEventMetadata
  | AssetHistoryEventLink
  | AssetHistoryEventUnlink;

/**
 * Asset History document content
 */
export interface AssetHistoryContent<
  TAssetHistoryEvent extends AssetHistoryEvent = any,
  TMeasures extends JSONObject = any,
  TMetadata extends Metadata = any
> extends KDocumentContent {
  /**
   * Name of the event who caused the historization
   *
   *  - `measure` a new measure has been received
   *  - `metadata` the asset metadata has been updated
   *  - `link` a device has been linked or unlinked to the asset
   *  - `unlink` a device has been unlinked from the asset
   */
  event: TAssetHistoryEvent;

  /**
   * ID of the historized asset
   */
  id: string;

  /**
   * Asset content after the event
   */
  asset: AssetContent<TMeasures, TMetadata>;
}
