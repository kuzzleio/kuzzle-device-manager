import { KDocumentContent } from 'kuzzle-sdk';
import { MetadataContent } from './MetadataContent';
import { JSONObject } from 'kuzzle';

export interface AssetCategoryContent extends KDocumentContent {
    name : string,
    parent? : string,
    assetMetadata: string[],
    metadataValues : JSONObject, //for static value. This is more generic than to save data in metadata because a subcategory can specify data from parent category.
}

export interface ProcessedAssetCategoryContent extends KDocumentContent {
    name : string,
    parent? : string,
    assetMetadata: MetadataContent[],
    metadataValues : JSONObject, //for static value. This is more generic than to save data in metadata because a subcategory can specify data from parent category.
}