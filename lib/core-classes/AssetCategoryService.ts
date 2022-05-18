import { MetadataContent } from '../types/MetadataContent';
import { AssetCategoryContent } from '../types/AssetCategoryContent';

export class AssetCategoryService {
  
  static getMetadatas (assetCategory : AssetCategoryContent) : MetadataContent[] {
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
  
}
