import { JSONObject, KDocument, KHit, SearchResult } from "kuzzle-sdk";

import {
  AssetModelContent,
  DeviceModelContent,
  GroupAffinity,
  GroupModelContent,
  LocaleDetails,
  MeasureModelContent,
  MetadataDetails,
  MetadataGroups,
  MetadataMappings,
  MetadataReferential,
  MetadataReferentialEntry,
  TooltipModels,
} from "./ModelContent";
import { SchemaObject } from "ajv";
import { MeasureValuesDetails } from "../../measure/types/MeasureDefinition";

interface ModelsControllerRequest {
  controller: "device-manager/models";
}

export interface ApiModelGetAssetRequest extends ModelsControllerRequest {
  action: "getAsset";
  model: string;
  engineGroups: string[];
  /**
   * Returns the stored model, without resolving its referential metadata
   */
  rawModel?: boolean;
}
export type ApiModelGetAssetResult = KDocument<AssetModelContent>;

export interface ApiModelGetDeviceRequest extends ModelsControllerRequest {
  action: "getDevice";
  model: string;
  /**
   * Returns the stored model, without resolving its referential metadata
   */
  rawModel?: boolean;
}
export type ApiModelGetDeviceResult = KDocument<DeviceModelContent>;

export interface ApiModelGetGroupRequest extends ModelsControllerRequest {
  action: "getGroup";
  model: string;
  /**
   * Returns the stored model, without resolving its referential metadata
   */
  rawModel?: boolean;
}
export type ApiModelGetGroupResult = KDocument<GroupModelContent>;

export interface ApiModelGetMeasureRequest extends ModelsControllerRequest {
  action: "getMeasure";
  type: string;
  engineId?: string;
}
export type ApiModelGetMeasureResult = KDocument<MeasureModelContent>;

export interface ApiModelWriteAssetRequest extends ModelsControllerRequest {
  action: "writeAsset";

  body: {
    engineGroups: string[];
    engineIds?: string[];
    model: string;
    icon?: string;
    metadataDetails?: MetadataDetails;
    metadataGroups?: MetadataGroups;
    metadataMappings?: MetadataMappings;
    defaultValues?: JSONObject;
    measures?: AssetModelContent["asset"]["measures"];
    tooltipModels?: TooltipModels;
    locales?: { [valueName: string]: LocaleDetails };
  };
}
export type ApiModelWriteAssetResult = KDocument<AssetModelContent>;

export interface ApiModelWriteDeviceRequest extends ModelsControllerRequest {
  action: "writeDevice";

  body: {
    model: string;
    icon?: string;
    metadataDetails?: MetadataDetails;
    metadataGroups?: MetadataGroups;
    metadataMappings?: MetadataMappings;
    defaultValues?: JSONObject;
    measures: DeviceModelContent["device"]["measures"];
  };
}
export type ApiModelWriteDeviceResult = KDocument<DeviceModelContent>;

export interface ApiModelWriteGroupRequest extends ModelsControllerRequest {
  action: "writeGroup";

  body: {
    affinity: GroupAffinity;
    engineGroups: string[];
    model: string;
    icon?: string;
    metadataDetails?: MetadataDetails;
    metadataGroups?: MetadataGroups;
    metadataMappings?: MetadataMappings;
    defaultValues?: JSONObject;
    locales?: { [valueName: string]: LocaleDetails };
  };
}
export type ApiModelWriteGroupResult = KDocument<GroupModelContent>;

export interface ApiModelUpdateDeviceRequest extends ModelsControllerRequest {
  action: "updateDevice";

  model: string;

  body: {
    /**
     * Full set of metadata mappings: the existing ones, unchanged, and the new ones,
     * which must be metadata of the referential (`{ referential: true }`)
     */
    metadataMappings: MetadataMappings;
    /**
     * Replaces the metadata details when present
     */
    metadataDetails?: MetadataDetails;
    /**
     * Replaces the default values when present
     */
    defaultValues?: JSONObject;
  };
}
export type ApiModelUpdateDeviceResult = KDocument<DeviceModelContent>;

export interface ApiModelUpdateGroupRequest extends ModelsControllerRequest {
  action: "updateGroup";

  engineGroups?: string[];
  model: string;

  body: {
    affinity?: GroupAffinity;
    icon?: string;
    metadataDetails?: MetadataDetails;
    metadataGroups?: MetadataGroups;
    metadataMappings?: MetadataMappings;
    defaultValues?: JSONObject;
    locales?: { [valueName: string]: LocaleDetails };
  };
}
export type ApiModelUpdateGroupResult = KDocument<GroupModelContent>;

export interface ApiModelWriteMeasureRequest extends ModelsControllerRequest {
  action: "writeMeasure";

  body: {
    type: string;
    engineIds?: string[];
    icon?: string;
    locales?: {
      [valueName: string]: LocaleDetails;
    };
    valuesMappings: JSONObject;
    validationSchema?: SchemaObject;
    valuesDetails?: MeasureValuesDetails;
  };
}
export type ApiModelWriteMeasureResult = KDocument<MeasureModelContent>;

export interface ApiModelUpdateAssetRequest extends ModelsControllerRequest {
  action: "updateAsset";

  engineGroups: string[];
  model: string;

  body: {
    icon?: string;
    metadataDetails?: MetadataDetails;
    metadataGroups?: MetadataGroups;
    metadataMappings?: MetadataMappings;
    defaultValues?: JSONObject;
    measures?: AssetModelContent["asset"]["measures"];
    tooltipModels?: TooltipModels;
    locales?: { [valueName: string]: LocaleDetails };
  };
}
export type ApiModelUpdateAssetResult = KDocument<AssetModelContent>;

export interface ApiModelDeleteAssetRequest extends ModelsControllerRequest {
  action: "deleteAsset";

  _id: string;
}
export type ApiModelDeleteAssetResult = void;

export interface ApiModelDeleteDeviceRequest extends ModelsControllerRequest {
  action: "deleteDevice";

  _id: string;
}
export type ApiModelDeleteDeviceResult = void;

export interface ApiModelDeleteGroupRequest extends ModelsControllerRequest {
  action: "deleteGroup";

  _id: string;
}
export type ApiModelDeleteGroupResult = void;

export interface ApiModelDeleteMeasureRequest extends ModelsControllerRequest {
  action: "deleteMeasure";

  _id: string;
}
export type ApiModelDeleteMeasureResult = void;

export interface ApiModelListAssetsRequest extends ModelsControllerRequest {
  action: "listAssets";

  engineGroups: string[];
  /**
   * Returns the stored model, without resolving its referential metadata
   */
  rawModel?: boolean;
}
export type ApiModelListAssetsResult = {
  models: KDocument<AssetModelContent>[];
  total: number;
};

export interface ApiModelListDevicesRequest extends ModelsControllerRequest {
  action: "listDevices";
  /**
   * Returns the stored model, without resolving its referential metadata
   */
  rawModel?: boolean;
}
export type ApiModelListDevicesResult = {
  models: KDocument<DeviceModelContent>[];
  total: number;
};

export interface ApiModelListGroupsRequest extends ModelsControllerRequest {
  action: "listGroups";
  engineGroups: string[];
  /**
   * Returns the stored model, without resolving its referential metadata
   */
  rawModel?: boolean;
}
export type ApiModelListGroupsResult = {
  models: KDocument<GroupModelContent>[];
  total: number;
};

export interface ApiModelListMeasuresRequest extends ModelsControllerRequest {
  action: "listMeasures";
  engineId?: string;
}
export type ApiModelListMeasuresResult = {
  models: KDocument<MeasureModelContent>[];
  total: number;
};

export interface ApiModelSearchAssetsRequest extends ModelsControllerRequest {
  action: "searchAssets";

  engineGroups: string[];
  /**
   * Returns the stored model, without resolving its referential metadata
   */
  rawModel?: boolean;
  from?: number;
  size?: number;
  scrollTTL?: string;
  body?: JSONObject;
}
export type ApiModelSearchAssetsResult = SearchResult<KHit<AssetModelContent>>;

export interface ApiModelSearchDevicesRequest extends ModelsControllerRequest {
  action: "searchDevices";
  /**
   * Returns the stored model, without resolving its referential metadata
   */
  rawModel?: boolean;

  from?: number;
  size?: number;
  scrollTTL?: string;
  body?: JSONObject;
}
export type ApiModelSearchDevicesResult = SearchResult<
  KHit<DeviceModelContent>
>;

export interface ApiModelSearchGroupsRequest extends ModelsControllerRequest {
  action: "searchGroups";

  engineGroups: string[];
  /**
   * Returns the stored model, without resolving its referential metadata
   */
  rawModel?: boolean;
  from?: number;
  size?: number;
  scrollTTL?: string;
  body?: JSONObject;
}
export type ApiModelSearchGroupsResult = SearchResult<KHit<GroupModelContent>>;

export interface ApiModelSearchMeasuresRequest extends ModelsControllerRequest {
  action: "searchMeasures";

  engineId?: string;
  from?: number;
  size?: number;
  scrollTTL?: string;
  body?: JSONObject;
}
export type ApiModelSearchMeasuresResult = SearchResult<
  KHit<MeasureModelContent>
>;

export interface ApiModelGetMetadataReferentialRequest extends ModelsControllerRequest {
  action: "getMetadataReferential";
}
export type ApiModelGetMetadataReferentialResult = MetadataReferential;

export interface ApiModelWriteMetadataRequest extends ModelsControllerRequest {
  action: "writeMetadata";

  name: string;

  body: MetadataReferentialEntry;
}
export type ApiModelWriteMetadataResult = MetadataReferential;

export interface ApiModelDeleteMetadataRequest extends ModelsControllerRequest {
  action: "deleteMetadata";

  name: string;
}
export type ApiModelDeleteMetadataResult = MetadataReferential;
