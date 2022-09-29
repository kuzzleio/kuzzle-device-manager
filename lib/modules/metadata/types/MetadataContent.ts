import { JSONObject, KDocumentContent } from "kuzzle";

import { FormattedMetadata } from './../../asset-category/types/AssetCategoryContent';

/* eslint-disable no-shadow, no-unused-vars */
export enum metadataType {
  string,
  number,
  date,
  boolean,
  enum,
  object,
  geo_point,
}

export interface MetadataContent extends KDocumentContent {
  name: string;
  valueType: metadataType;
  unit?: string;
  objectValueList?: { object: FormattedMetadata[] }[];
  //internalProperties? : MetadataContent[], //Only object type //TODO!
  valueList?: string; //Only for enum type
  mandatory: boolean;
}

export interface ProcessedMetadataContent extends KDocumentContent {
  name: string;
  valueType: metadataType;
  unit?: string;
  objectValueList?: JSONObject[];
  //internalProperties? : MetadataContent[], //Only object type //TODO!
  valueList?: string; //Only for enum type
  mandatory: boolean;
}
