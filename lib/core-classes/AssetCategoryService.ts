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

  async getMetadataFromId (assetCategory : AssetCategoryContent, engineId :string, metadataList) {
    if ( assetCategory.assetMetadata) {
      for (const metadataId of assetCategory.assetMetadata) {
        const m = await this.sdk.document.get<MetadataContent>(engineId, 'metadata', metadataId);
        metadataList.push({
          'mandatory': m._source.mandatory,
          'name': m._source.name,
          'unit': m._source.unit,
          'valueList': m._source.valueList,
          'valueType': m._source.valueType,
        });
      }
    }
  }
  
  async getMetadata (assetCategory : AssetCategoryContent, engineId : string) : Promise<MetadataContent[]> {
    let metadataList;
    metadataList = [];
    await this.getMetadataFromId(assetCategory, engineId, metadataList);

    let assetCategoryTmp = assetCategory;
    while (assetCategoryTmp.parent) {
      try {
        const parent = await this.sdk.document.get<AssetCategoryContent>(engineId, 'asset-category', assetCategoryTmp.parent);
        await this.getMetadataFromId(parent._source, engineId, metadataList);
        assetCategoryTmp = parent._source;
      }
      catch (e) {
        assetCategoryTmp = null;
      }
    }
    return metadataList;
  }

  async getMetadataValues (assetCategory : AssetCategoryContent, engineId : string) : Promise<JSONObject[]> {
    let getMetadataValues;
    if (! assetCategory.metadataValues) {
      getMetadataValues = [];
    }
    else {
      getMetadataValues = JSON.parse(JSON.stringify(assetCategory.metadataValues));
    }
    let assetCategoryTmp = assetCategory;
    while (assetCategoryTmp.parent) {
      try {
        const parent = await this.sdk.document.get<AssetCategoryContent>(engineId, 'asset-category', assetCategoryTmp.parent);
        if (parent._source.assetMetadata) {
          getMetadataValues = getMetadataValues.concat(parent._source.assetMetadata);
        }
        assetCategoryTmp = parent._source;
      }
      catch (e) {
        assetCategoryTmp = null;
      }
    }
    return getMetadataValues;
  }


  async validateMetadata (assetMetadata : JSONObject, engineId : string, category : string) {
    const assetCategory = await this.sdk.document.get<AssetCategoryContent>(engineId, 'asset-category', category);
    const metadataList = await this.getMetadata(assetCategory._source, engineId);
    const metadataValues = await this.getMetadataValues(assetCategory._source, engineId);
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
