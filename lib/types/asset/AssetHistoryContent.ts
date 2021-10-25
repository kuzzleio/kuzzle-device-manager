import { AssetContentBase } from './AssetContentBase';

export interface AssetHistoryContent {
  assetId: string;

  /**
   * Names of measures historized in the document
   */
  measureTypes: string[];

  asset: AssetContentBase;
}
