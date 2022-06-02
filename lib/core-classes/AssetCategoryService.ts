import { MetadataContent } from '../types/MetadataContent';
import { AssetCategoryContent } from '../types/AssetCategoryContent';
import { JSONObject, Plugin, PluginContext } from 'kuzzle';
import { DeviceManagerConfiguration } from '../types';

export class AssetCategoryService {

  private config: DeviceManagerConfiguration;
  private context: PluginContext;

  private get sdk () {
    return this.context.accessors.sdk;
  }

  constructor (plugin: Plugin) {
    this.config = plugin.config as any;
    this.context = plugin.context;
  }

  getMetadata (assetCategory : AssetCategoryContent) : MetadataContent[] {
    let metadataList;
    if (! assetCategory.assetMetadata) {
      metadataList = [];
    }
    else {
      metadataList = JSON.parse(JSON.stringify(assetCategory.assetMetadata));
    }
    let assetCategoryTmp = assetCategory;
    while (assetCategoryTmp.parent) {
      if (assetCategoryTmp.parent.assetMetadata) {
        metadataList = metadataList.concat(assetCategoryTmp.parent.assetMetadata);
      }
      assetCategoryTmp = assetCategoryTmp.parent;
    }
    return metadataList;
  }

  getMetadataValues (assetCategory : AssetCategoryContent) : JSONObject[] {
    let metadataValueList;
    if (! assetCategory.assetMetadata) {
      metadataValueList = [];
    }
    else {
      metadataValueList = JSON.parse(JSON.stringify(assetCategory.metadataValues));
    }
    let assetCategoryTmp = assetCategory;
    while (assetCategoryTmp.parent) {
      if (assetCategoryTmp.parent.metadataValues) {
        metadataValueList = metadataValueList.concat(assetCategoryTmp.parent.metadataValues);
      }
      assetCategoryTmp = assetCategoryTmp.parent;
    }
    return metadataValueList;
  }


  async validateMetadata (assetMetadata : JSONObject, engineId : string, category : string) {
    const assetCategory = await this.sdk.document.get<AssetCategoryContent>(engineId, 'asset-category', category);
    const metadataList = this.getMetadata(assetCategory._source);
    const metadataValues = this.getMetadataValues(assetCategory._source);
    for (const metadata of metadataList) {
      if (metadata.mandatory) {
        // eslint-disable-next-line no-prototype-builtins
        if (! (assetMetadata[metadata.name]) && ! metadataValues[metadata.name]) {
          throw global.app.errors.get('device-manager', 'assetController', 'MandatoryMetadata', metadata.name);
        }
      }
    }
  }
  
}
