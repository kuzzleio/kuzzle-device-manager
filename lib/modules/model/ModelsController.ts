import { ControllerDefinition, KuzzleRequest } from "kuzzle";

import { ModelService } from "./ModelService";
import {
  ApiModelWriteAssetResult,
  ApiModelWriteDeviceResult,
  ApiModelWriteMeasureResult,
  ApiModelUpdateAssetResult,
  ApiModelDeleteAssetResult,
  ApiModelDeleteDeviceResult,
  ApiModelDeleteMeasureResult,
  ApiModelListAssetsResult,
  ApiModelListDevicesResult,
  ApiModelListMeasuresResult,
  ApiModelGetAssetResult,
  ApiModelGetDeviceResult,
  ApiModelGetMeasureResult,
  ApiModelSearchAssetsResult,
  ApiModelSearchDevicesResult,
  ApiModelSearchMeasuresResult,
  ApiModelDeleteGroupResult,
  ApiModelGetGroupResult,
  ApiModelListGroupsResult,
  ApiModelSearchGroupsResult,
  ApiModelWriteGroupResult,
} from "./types/ModelApi";

export class ModelsController {
  private modelService: ModelService;

  public definition: ControllerDefinition;

  constructor(modelService: ModelService) {
    this.modelService = modelService;

    this.definition = {
      actions: {
        deleteAsset: {
          handler: this.deleteAsset.bind(this),
          http: [{ path: "device-manager/models/asset/:_id", verb: "delete" }],
        },
        deleteDevice: {
          handler: this.deleteDevice.bind(this),
          http: [{ path: "device-manager/models/device/:_id", verb: "delete" }],
        },
        deleteGroup: {
          handler: this.deleteGroup.bind(this),
          http: [{ path: "device-manager/models/group/:_id", verb: "delete" }],
        },
        deleteMeasure: {
          handler: this.deleteMeasure.bind(this),
          http: [
            { path: "device-manager/models/measure/:_id", verb: "delete" },
          ],
        },
        getAsset: {
          handler: this.getAsset.bind(this),
          http: [{ path: "device-manager/models/asset/:model", verb: "get" }],
        },
        getDevice: {
          handler: this.getDevice.bind(this),
          http: [{ path: "device-manager/models/device/:model", verb: "get" }],
        },
        getGroup: {
          handler: this.getGroup.bind(this),
          http: [{ path: "device-manager/models/group/:model", verb: "get" }],
        },
        getMeasure: {
          handler: this.getMeasure.bind(this),
          http: [{ path: "device-manager/models/measure/:type", verb: "get" }],
        },
        listAssets: {
          handler: this.listAssets.bind(this),
          http: [{ path: "device-manager/models/assets", verb: "get" }],
        },
        listDevices: {
          handler: this.listDevices.bind(this),
          http: [{ path: "device-manager/models/devices", verb: "get" }],
        },
        listGroups: {
          handler: this.listGroups.bind(this),
          http: [{ path: "device-manager/models/groups", verb: "get" }],
        },
        listMeasures: {
          handler: this.listMeasures.bind(this),
          http: [{ path: "device-manager/models/measures", verb: "get" }],
        },
        searchAssets: {
          handler: this.searchAssets.bind(this),
          http: [
            { path: "device-manager/models/assets/_search", verb: "post" },
          ],
        },
        searchDevices: {
          handler: this.searchDevices.bind(this),
          http: [
            { path: "device-manager/models/devices/_search", verb: "post" },
          ],
        },
        searchGroups: {
          handler: this.searchGroups.bind(this),
          http: [
            { path: "device-manager/models/groups/_search", verb: "post" },
          ],
        },
        searchMeasures: {
          handler: this.searchMeasures.bind(this),
          http: [
            { path: "device-manager/models/measures/_search", verb: "post" },
          ],
        },
        updateAsset: {
          handler: this.updateAsset.bind(this),
          http: [
            { path: "device-manager/models/assets/:model", verb: "patch" },
          ],
        },
        writeAsset: {
          handler: this.writeAsset.bind(this),
          http: [{ path: "device-manager/models/assets", verb: "post" }],
        },
        writeDevice: {
          handler: this.writeDevice.bind(this),
          http: [{ path: "device-manager/models/devices", verb: "post" }],
        },
        writeGroup: {
          handler: this.writeGroup.bind(this),
          http: [{ path: "device-manager/models/groups", verb: "post" }],
        },
        writeMeasure: {
          handler: this.writeMeasure.bind(this),
          http: [{ path: "device-manager/models/measures", verb: "post" }],
        },
      },
    };
  }

  async getAsset(request: KuzzleRequest): Promise<ApiModelGetAssetResult> {
    const model = request.getString("model");
    const engineGroup = request.getString("engineGroup", "commons");

    const assetModel = await this.modelService.getAsset(engineGroup, model);

    return assetModel;
  }

  async getDevice(request: KuzzleRequest): Promise<ApiModelGetDeviceResult> {
    const model = request.getString("model");

    const deviceModel = await this.modelService.getDevice(model);

    return deviceModel;
  }

  async getGroup(request: KuzzleRequest): Promise<ApiModelGetGroupResult> {
    const model = request.getString("model");

    const groupModel = await this.modelService.getGroup(model);

    return groupModel;
  }
  async getMeasure(request: KuzzleRequest): Promise<ApiModelGetMeasureResult> {
    const type = request.getString("type");

    const measureModel = await this.modelService.getMeasure(type);

    return measureModel;
  }

  async writeAsset(request: KuzzleRequest): Promise<ApiModelWriteAssetResult> {
    const engineGroup = request.getBodyString("engineGroup");
    const model = request.getBodyString("model");
    const metadataMappings = request.getBodyObject("metadataMappings", {});
    const defaultValues = request.getBodyObject("defaultValues", {});
    const measures = request.getBodyArray("measures", []);
    const metadataDetails = request.getBodyObject("metadataDetails", {});
    const metadataGroups = request.getBodyObject("metadataGroups", {});
    const tooltipModels = request.getBodyObject("tooltipModels", {});

    const assetModel = await this.modelService.writeAsset(
      engineGroup,
      model,
      metadataMappings,
      defaultValues,
      metadataDetails,
      metadataGroups,
      measures,
      tooltipModels,
    );

    return assetModel;
  }

  async writeDevice(
    request: KuzzleRequest,
  ): Promise<ApiModelWriteDeviceResult> {
    const model = request.getBodyString("model");
    const metadataMappings = request.getBodyObject("metadataMappings", {});
    const defaultValues = request.getBodyObject("defaultValues", {});
    const measures = request.getBodyArray("measures");
    const metadataDetails = request.getBodyObject("metadataDetails", {});
    const metadataGroups = request.getBodyObject("metadataGroups", {});

    const deviceModel = await this.modelService.writeDevice(
      model,
      metadataMappings,
      defaultValues,
      metadataDetails,
      metadataGroups,
      measures,
    );

    return deviceModel;
  }

  async writeGroup(request: KuzzleRequest): Promise<ApiModelWriteGroupResult> {
    const engineGroup = request.getBodyString("engineGroup");
    const model = request.getBodyString("model");
    const metadataMappings = request.getBodyObject("metadataMappings", {});
    const defaultValues = request.getBodyObject("defaultValues", {});
    const metadataDetails = request.getBodyObject("metadataDetails", {});
    const metadataGroups = request.getBodyObject("metadataGroups", {});

    const groupModel = await this.modelService.writeGroup(
      engineGroup,
      model,
      metadataMappings,
      defaultValues,
      metadataDetails,
      metadataGroups,
    );

    return groupModel;
  }

  async writeMeasure(
    request: KuzzleRequest,
  ): Promise<ApiModelWriteMeasureResult> {
    const type = request.getBodyString("type");
    const valuesMappings = request.getBodyObject("valuesMappings");
    const validationSchema = request.getBodyObject("validationSchema", {});
    const valuesDetails = request.getBodyObject("valuesDetails", {});

    const measureModel = await this.modelService.writeMeasure(
      type,
      valuesMappings,
      validationSchema,
      valuesDetails,
    );

    return measureModel;
  }

  async deleteAsset(
    request: KuzzleRequest,
  ): Promise<ApiModelDeleteAssetResult> {
    const _id = request.getId();

    await this.modelService.deleteAsset(_id);
  }

  async deleteDevice(
    request: KuzzleRequest,
  ): Promise<ApiModelDeleteDeviceResult> {
    const _id = request.getId();

    await this.modelService.deleteDevice(_id);
  }

  async deleteGroup(
    request: KuzzleRequest,
  ): Promise<ApiModelDeleteGroupResult> {
    const _id = request.getId();

    await this.modelService.deleteGroup(_id);
  }

  async deleteMeasure(
    request: KuzzleRequest,
  ): Promise<ApiModelDeleteMeasureResult> {
    const _id = request.getId();

    await this.modelService.deleteMeasure(_id);
  }

  async listAssets(request: KuzzleRequest): Promise<ApiModelListAssetsResult> {
    const engineGroup = request.getString("engineGroup");

    const models = await this.modelService.listAsset(engineGroup);

    return {
      models,
      total: models.length,
    };
  }

  async listDevices(): Promise<ApiModelListDevicesResult> {
    const models = await this.modelService.listDevices();

    return {
      models,
      total: models.length,
    };
  }

  async listGroups(request: KuzzleRequest): Promise<ApiModelListGroupsResult> {
    const engineGroup = request.getString("engineGroup");
    const models = await this.modelService.listGroups(engineGroup);

    return {
      models,
      total: models.length,
    };
  }

  async listMeasures(): Promise<ApiModelListMeasuresResult> {
    const models = await this.modelService.listMeasures();

    return {
      models,
      total: models.length,
    };
  }

  async searchAssets(
    request: KuzzleRequest,
  ): Promise<ApiModelSearchAssetsResult> {
    return this.modelService.searchAssets(
      request.getString("engineGroup"),
      request.getSearchParams(),
    );
  }

  async searchDevices(
    request: KuzzleRequest,
  ): Promise<ApiModelSearchDevicesResult> {
    return this.modelService.searchDevices(request.getSearchParams());
  }

  async searchGroups(
    request: KuzzleRequest,
  ): Promise<ApiModelSearchGroupsResult> {
    return this.modelService.searchGroups(
      request.getString("engineGroup"),
      request.getSearchParams(),
    );
  }

  async searchMeasures(
    request: KuzzleRequest,
  ): Promise<ApiModelSearchMeasuresResult> {
    return this.modelService.searchMeasures(request.getSearchParams());
  }

  async updateAsset(
    request: KuzzleRequest,
  ): Promise<ApiModelUpdateAssetResult> {
    const engineGroup = request.getString("engineGroup");
    const model = request.getString("model");
    const metadataMappings = request.getBodyObject("metadataMappings", {});
    const defaultValues = request.getBodyObject("defaultValues", {});
    const measures = request.getBodyArray("measures", []);
    const metadataDetails = request.getBodyObject("metadataDetails", {});
    const metadataGroups = request.getBodyObject("metadataGroups", {});
    const tooltipModels = request.getBodyObject("tooltipModels", {});

    const updatedAssetModel = await this.modelService.updateAsset(
      engineGroup,
      model,
      metadataMappings,
      defaultValues,
      metadataDetails,
      metadataGroups,
      measures,
      tooltipModels,
      request,
    );

    return updatedAssetModel;
  }
}
