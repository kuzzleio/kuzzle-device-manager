import { KDocumentContent } from 'kuzzle-sdk';
import { MetadataContent } from './MetadataContent';

export interface AssetCategoryContent extends KDocumentContent {
    name : string,
    parent? : AssetCategoryContent,
    assetMetadatas: MetadataContent[],
    metadatasValues : Map<string, any>, //for static value. This is more generic thant to save data in metadatas because a subcategory can specify data from parent category.

}