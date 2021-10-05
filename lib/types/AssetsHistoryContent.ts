import { BaseAssetContent } from './BaseAssetContent';

export interface AssetsHistoryContent {
  assetId: string;

  /**
   * Names of measures historized in the document
   */
  measureTypes: string[];

  asset: BaseAssetContent;
}
