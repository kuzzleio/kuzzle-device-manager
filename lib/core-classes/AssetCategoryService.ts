import { MetadataContent } from '../types/MetadataContent';
import { AssetCategoryContent } from '../types/AssetCategoryContent';
import { Plugin, PluginContext } from 'kuzzle';
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

  getMetadatas (assetCategory : AssetCategoryContent) : MetadataContent[] {
    let metadataList;
    if (! assetCategory.assetMetadatas) {
      metadataList = [];
    }
    else {
      metadataList = JSON.parse(JSON.stringify(assetCategory.assetMetadatas));
    }
    let assetCategoryTmp = assetCategory;
    while (assetCategoryTmp.parent) {
      if (assetCategoryTmp.parent.assetMetadatas) {
        metadataList = metadataList.concat(assetCategoryTmp.parent.assetMetadatas);
      }
      assetCategoryTmp = assetCategoryTmp.parent;
    }
    return metadataList;
  }

  getMetadatasValues (assetCategory : AssetCategoryContent) {
    let metadataValueList;
    if (! assetCategory.assetMetadatas) {
      metadataValueList = [];
    }
    else {
      metadataValueList = JSON.parse(JSON.stringify(assetCategory.metadatasValues));
    }
    let assetCategoryTmp = assetCategory;
    while (assetCategoryTmp.parent) {
      if (assetCategoryTmp.parent.metadatasValues) {
        metadataValueList = metadataValueList.concat(assetCategoryTmp.parent.metadatasValues);
      }
      assetCategoryTmp = assetCategoryTmp.parent;
    }
    return metadataValueList;
  }


  async validateMetadata (assetMetadata, engineId, category) {
    const assetCategory = await this.sdk.document.get<AssetCategoryContent>(engineId, 'asset-category', category);
    const metadatas = this.getMetadatas(assetCategory._source);
    const metadatasValues = this.getMetadatasValues(assetCategory._source);
    for (const metadata of metadatas) {
      if (metadata.mandatory) {
        // eslint-disable-next-line no-prototype-builtins
        if (! (assetMetadata && assetMetadata.hasOwnProperty(metadata.name)) && ! metadatasValues.hasOwnProperty(metadata.name)) {
          throw global.app.errors.get('device-manager', 'assetController', 'MandatoryMetadata', metadata.name);
        }
      }
    }
  }
  
}
