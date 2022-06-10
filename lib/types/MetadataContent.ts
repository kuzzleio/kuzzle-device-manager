import { KDocumentContent } from 'kuzzle-sdk';

/* eslint-disable no-shadow, no-unused-vars */
export enum metadataType {
    string,
    number,
    date,
    booléen,
    enum,
    object,
    geo_point,
}

export interface MetadataContent extends KDocumentContent {
    name : string,
    valueType : metadataType,
    unit? : string,
    internalProperties? : MetadataContent[], //Only object type
    valueList? : string, //Only for enum type
    mandatory : boolean,
}

