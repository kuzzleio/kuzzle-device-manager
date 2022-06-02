import { KDocumentContent } from 'kuzzle-sdk';
import { MetadataContent } from './MetadataContent';
import { JSONObject } from 'kuzzle';

export interface AssetCategoryContent extends KDocumentContent {
    name : string,
    parent? : AssetCategoryContent,
    assetMetadatas: MetadataContent[],
    metadatasValues : JSONObject, //for static value. This is more generic thant to save data in metadatas because a subcategory can specify data from parent category.

}