import { KDocumentContent } from "kuzzle-sdk";

import { Metadata } from "../../shared";

import { AssetContent } from "./AssetContent";

export type AssetHistoryMetadata = {
  names: string[];
};

export type AssetHistoryEventMetadata = {
  name: "metadata";
  metadata: AssetHistoryMetadata;
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
  | AssetHistoryEventMetadata
  | AssetHistoryEventLink
  | AssetHistoryEventUnlink;

/**
 * Asset History document content
 */
export interface AssetHistoryContent<
  TAssetHistoryEvent extends AssetHistoryEvent = any,
  TMetadata extends Metadata = any,
> extends KDocumentContent {
  /**
   * Name of the event who caused the historization
   *
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
  asset: AssetContent<TMetadata>;

  /**
   * Timestamp of the event according to its type
   *
   *  - `metadata`: the current date of the event
   *  - `link`: the current date of the event
   *  - `unlink`: the current date of the event
   */
  timestamp: number;
}
