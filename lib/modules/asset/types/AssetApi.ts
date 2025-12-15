import {
  JSONObject,
  KDocument,
  KHit,
  SearchResult,
  UpdateByQueryResponse,
} from "kuzzle-sdk";

import { MeasureContent, Measurement } from "../../../modules/measure";
import {
  ApiDigitalTwinGetLastMeasuredAtRequest,
  ApiDigitalTwinGetLastMeasuredAtResult,
  ApiDigitalTwinGetLastMeasuresRequest,
  ApiDigitalTwinGetLastMeasuresResult,
  ApiDigitalTwinMGetLastMeasuredAtRequest,
  ApiDigitalTwinMGetLastMeasuredAtResult,
  ApiDigitalTwinMGetLastMeasuresRequest,
  ApiDigitalTwinMGetLastMeasuresResult,
  Metadata,
} from "../../shared";

import { AssetContent } from "./AssetContent";

type AssetsControllerName = "device-manager/assets";
import { ApiMeasureSource } from "../../measure/types/MeasureSources";
import { DeviceContent } from "lib/modules/device";

interface AssetsControllerRequest {
  controller: AssetsControllerName;

  engineId: string;
}

export interface ApiAssetGetRequest extends AssetsControllerRequest {
  action: "get";

  _id: string;
}
export type ApiAssetGetResult = KDocument<AssetContent>;

export interface ApiAssetUpdateRequest extends AssetsControllerRequest {
  action: "update";

  _id: string;

  refresh?: string;

  body: {
    metadata: Metadata;
  };
}
export type ApiAssetUpdateResult = KDocument<AssetContent>;

export interface ApiAssetMetadataReplaceRequest
  extends AssetsControllerRequest {
  action: "replaceMetadata";

  _id: string;

  refresh?: string;

  body: {
    metadata: Metadata;
  };
}
export type ApiAssetMetadataReplaceResult = KDocument<AssetContent>;

export interface ApiAssetUpsertRequest extends AssetsControllerRequest {
  action: "upsert";

  refresh?: string;

  body: {
    model: string;

    reference: string;

    metadata: Metadata;
  };
}
export type ApiAssetUpsertResult = KDocument<AssetContent>;

export interface ApiAssetCreateRequest extends AssetsControllerRequest {
  action: "create";

  refresh?: string;

  body: {
    model: string;

    reference: string;

    metadata?: Metadata;
  };
}
export type ApiAssetCreateResult = KDocument<AssetContent>;

export interface ApiAssetDeleteRequest extends AssetsControllerRequest {
  action: "delete";

  _id: string;

  refresh?: string;

  strict?: boolean;
}
export type ApiAssetDeleteResult = void;

export interface ApiAssetSearchRequest extends AssetsControllerRequest {
  action: "search";

  from?: number;

  size?: number;

  scrollTTL?: string;

  lang?: "koncorde" | "elasticsearch";

  body: JSONObject;
}
export type ApiAssetSearchResult = SearchResult<KHit<AssetContent>>;

export interface ApiAssetGetMeasuresRequest extends AssetsControllerRequest {
  action: "getMeasures";

  _id: string;

  size?: number;

  from?: number;

  startAt?: string;

  endAt?: string;

  type?: string;

  lang?: "koncorde" | "elasticsearch";

  body?: {
    query?: JSONObject;
    sort?: JSONObject;
  };
}
export type ApiAssetGetMeasuresResult = {
  measures: Array<KDocument<MeasureContent<JSONObject>>>;
  total: number;
};

type TypelessApiMeasureSource = Omit<ApiMeasureSource, "type">;

export interface ApiAssetMeasureIngestRequest extends AssetsControllerRequest {
  action: "measureIngest";

  assetId: string;

  engineId: string;
  engineGroup?: string;
  slotName: string;

  body: {
    dataSource: TypelessApiMeasureSource;
    measuredAt: number;
    values: JSONObject;
  };
}
export type ApiAssetMeasureIngestResult = void;

type APIDecodedMeasurement = Omit<Measurement, "type"> & { slotName: string };

export interface ApiAssetmMeasureIngestRequest extends AssetsControllerRequest {
  action: "mMeasureIngest";

  assetId: string;

  engineId: string;
  engineGroup?: string;

  body: {
    dataSource: TypelessApiMeasureSource;
    measurements: APIDecodedMeasurement[];
  };
}

export type ApiAssetmMeasureIngestResult = void;

export type ApiAssetGetLastMeasuresRequest =
  ApiDigitalTwinGetLastMeasuresRequest<AssetsControllerName>;
export type ApiAssetGetLastMeasuresResult = ApiDigitalTwinGetLastMeasuresResult;

export type ApiAssetMGetLastMeasuresRequest =
  ApiDigitalTwinMGetLastMeasuresRequest<AssetsControllerName>;
export type ApiAssetMGetLastMeasuresResult =
  ApiDigitalTwinMGetLastMeasuresResult;

/**
 * This action can be used only with WebSocket or POST
 *
 * Then the export can be download using HTTP Get and the following route:
 *  `/_/device-manager/:engineId/devices/:_id/measures/_export/:exportId`
 */
export interface ApiAssetExportMeasuresRequest extends AssetsControllerRequest {
  action: "exportMeasures";

  _id: string;

  startAt?: string;

  endAt?: string;

  type?: string;

  lang?: "koncorde" | "elasticsearch";

  body?: {
    query?: JSONObject;
    sort?: JSONObject;
  };
}
export type ApiAssetExportMeasuresResult = {
  link: string;
};

export interface ApiAssetExportRequest extends AssetsControllerRequest {
  action: "export";

  lang?: "koncorde" | "elasticsearch";

  body?: {
    query?: JSONObject;
    sort?: JSONObject;
  };
}
export type ApiAssetExportResult = {
  link: string;
};

export interface ApiAssetMigrateTenantRequest extends AssetsControllerRequest {
  action: "migrateTenant";
  engineId: string;
  body: {
    assetsList: string[];
    newEngineId: string;
    includeDevices?: boolean;
  };
}
export type ApiAssetMigrateTenantResult = {
  errors: string[];
  successes: string[];
};

export type ApiAssetGetLastMeasuredAtRequest =
  ApiDigitalTwinGetLastMeasuredAtRequest<AssetsControllerName>;
export type ApiAssetGetLastMeasuredAtResult =
  ApiDigitalTwinGetLastMeasuredAtResult;

export type ApiAssetMGetLastMeasuredAtRequest =
  ApiDigitalTwinMGetLastMeasuredAtRequest<AssetsControllerName>;
export type ApiAssetMGetLastMeasuredAtResult =
  ApiDigitalTwinMGetLastMeasuredAtResult;

export type ApiAssetUpdateModelLocales = {
  engineIndex: string;
  result: UpdateByQueryResponse<AssetContent>;
};

export interface ApiAssetlinkDevicesRequest extends AssetsControllerRequest {
  action: "linkDevices";

  _id: string;

  refresh?: string;
  body: {
    linkedMeasures: Array<{
      deviceId: string;
      /**
       * This option allows to not specify the names of all the measures that should
       * be linked to the asset.
       *
       * The algorithm will go through all the measures names provided by the device
       * and add the one who are present with the same name in the asset.
       *
       * It will not add the measure if:
       *   - it has been specified in the link request
       *   - it was already present in the asset
       *
       * @example
       *   if the device provide a measure of type "temperature" with the name "temp"
       *   if the asset has declared a measure of type "temperature" with the name "temp"
       *   then the measure will be automatically added in the link and will later be propagated to the asset
       */
      implicitMeasuresLinking?: boolean;
      /**
       * Names of the linked measures.
       *
       * Array<{ asset: string, device: string }>
       *
       * @example
       *
       * [
       *   { asset: "externalTemperature", device: "temperature" }
       * ]
       */
      measureSlots?: Array<{ asset: string; device: string }>;
    }>;
  };
}
export type ApiAssetLinkDevicesResult = {
  asset: KDocument<AssetContent>;
  devices: KDocument<DeviceContent>[];
};

export interface ApiAssetUnlinkDevicesRequest extends AssetsControllerRequest {
  action: "unlinkDevices";

  _id: string;

  strict?: boolean;

  refresh?: string;

  body: {
    /**
     * This options allows to unlink all the measures of the asset
     */
    allMeasures?: boolean;
    /**
     * Names of the measure slots of the asset to unlink.
     *
     * string[]
     *
     * @example
     *
     * ['externalTemperature','position']
     */
    measureSlots?: string[];
    /**
     * Ids of the devices to unlink.
     *
     * string[]
     *
     * @example
     *
     * ['First-asset','Second-asset']
     */
    devices?: string[];
  };
}

export type ApiAssetUnlinkDevicesResult = {
  asset: KDocument<AssetContent>;
  devices: KDocument<DeviceContent>[];
};
