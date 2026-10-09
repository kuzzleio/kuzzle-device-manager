import {
  BadRequestError,
  ControllerDefinition,
  KuzzleRequest,
  NotFoundError,
} from "kuzzle";

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
import { KuzzleLogger } from "kuzzle-logger";

export class ModelsController {
  private modelService: ModelService;

  public definition: ControllerDefinition;
  readonly logger: KuzzleLogger;
  constructor(modelService: ModelService, logger: KuzzleLogger) {
    this.modelService = modelService;
    this.logger = logger;
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
    const engineGroups = request.getArray("engineGroups", []) || ["commons"];
    const index = request.input.args.index as string | undefined;

    const assetModel = await this.modelService.getAsset(
      engineGroups,
      index,
      model,
    );

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
    const index = request.input.args.index as string | undefined;

    const measureModel = await this.modelService.getMeasure(type, index);

    return measureModel;
  }

  async writeAsset(request: KuzzleRequest): Promise<ApiModelWriteAssetResult> {
    const engineGroups = request.getBodyArray("engineGroups", []) as string[];
    const model = request.getBodyString("model");
    const metadataMappings = request.getBodyObject("metadataMappings", {});
    const defaultValues = request.getBodyObject("defaultValues", {});
    const measures = request.getBodyArray("measures", []);
    const metadataDetails = request.getBodyObject("metadataDetails", {});
    const metadataGroups = request.getBodyObject("metadataGroups", {});
    const tooltipModels = request.getBodyObject("tooltipModels", {});
    const locales = request.getBodyObject("locales", {});
    const indexes = request.getBodyArray("indexes", []);
    const icon = request.input.body?.icon as string | undefined;

    const assetModel = await this.modelService.writeAsset(
      engineGroups,
      model,
      metadataMappings,
      defaultValues,
      metadataDetails,
      metadataGroups,
      measures,
      tooltipModels,
      locales,
      indexes,
      icon,
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
    const icon = request.input.body?.icon as string | undefined;

    const deviceModel = await this.modelService.writeDevice(
      model,
      metadataMappings,
      defaultValues,
      metadataDetails,
      metadataGroups,
      measures,
      icon,
    );

    return deviceModel;
  }

  async writeGroup(request: KuzzleRequest): Promise<ApiModelWriteGroupResult> {
    const engineGroups = request.getBodyArray("engineGroups") as string[];
    const model = request.getBodyString("model");
    const affinity = request.getBodyObject("affinity", {
      models: { assets: [], devices: [] },
      strict: false,
      type: ["assets", "devices"],
    });
    const metadataMappings = request.getBodyObject("metadataMappings", {});
    const defaultValues = request.getBodyObject("defaultValues", {});
    const metadataDetails = request.getBodyObject("metadataDetails", {});
    const metadataGroups = request.getBodyObject("metadataGroups", {});
    const locales = request.getBodyObject("locales", {});
    const icon = request.input.body?.icon as string | undefined;

    const groupModel = await this.modelService.writeGroup(
      engineGroups,
      model,
      affinity,
      metadataMappings,
      defaultValues,
      metadataDetails,
      metadataGroups,
      icon,
      locales,
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
    const locales = request.getBodyObject("locales", {});
    const indexes = request.getBodyArray("indexes", []);
    const icon = request.input.body?.icon as string | undefined;

    const measureModel = await this.modelService.writeMeasure(
      type,
      valuesMappings,
      validationSchema,
      valuesDetails,
      locales,
      indexes,
      icon,
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
    const engineGroups = request.getArray("engineGroups", []);
    const index = request.input.args.index as string | undefined;
    const user = request.getUser() as { profileIds: string[] };
    const isAdmin = user.profileIds.includes("admin");
    const isAnonymous =
      user.profileIds.includes("anonymous") || user.profileIds.length === 0;

    // Super admin without engineGroups: return all asset models
    if (isAdmin && engineGroups.length === 0 && !index) {
      const models = await this.modelService.listAllAssets();
      return { models, total: models.length };
    }

    // Authenticated non-admin/non-anonymous must provide engineGroups or index
    if (!isAdmin && !isAnonymous && engineGroups.length === 0 && !index) {
      throw new BadRequestError(
        'Missing argument: "engineGroups" or "index" must be provided.',
      );
    }

    // Validate index and engineGroups for authenticated non-admin users
    if (!isAdmin && !isAnonymous) {
      // Whether the user may act on this engine is Kuzzle's call, not ours:
      // the engine is the request `index`, so a profile restricted to its
      // tenant is refused any other engine by the core before this runs.
      if (index) {
        const engineExists = await this.modelService.engineExists(index);
        if (!engineExists) {
          throw new NotFoundError(`Engine "${index}" not found.`);
        }
      }

      if (engineGroups.length > 0) {
        const invalidGroups =
          await this.modelService.findInvalidEngineGroups(engineGroups);
        if (invalidGroups.length > 0) {
          throw new NotFoundError(
            `Engine group(s) not found: ${invalidGroups.join(", ")}.`,
          );
        }
      }
    }

    // Always include commons alongside requested groups
    if (engineGroups.length > 0 && !engineGroups.includes("commons")) {
      engineGroups.push("commons");
    }

    if (engineGroups.length === 0) {
      engineGroups.push("commons");
    }

    const models = await this.modelService.listAsset(engineGroups, index);

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
    const engineGroups = request.getArray("engineGroups", []) || ["commons"];
    const models = await this.modelService.listGroups(engineGroups);

    return {
      models,
      total: models.length,
    };
  }

  async listMeasures(
    request: KuzzleRequest,
  ): Promise<ApiModelListMeasuresResult> {
    const index = request.input.args.index as string | undefined;

    const models = await this.modelService.listMeasures(index);

    return {
      models,
      total: models.length,
    };
  }

  async searchAssets(
    request: KuzzleRequest,
  ): Promise<ApiModelSearchAssetsResult> {
    const index = request.input.args.index as string | undefined;

    return this.modelService.searchAssets(
      request.getArray("engineGroups", []) || ["commons"],
      index,
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
      request.getArray("engineGroups", []) || ["commons"],
      request.getSearchParams(),
    );
  }

  async searchMeasures(
    request: KuzzleRequest,
  ): Promise<ApiModelSearchMeasuresResult> {
    const index = request.input.args.index as string | undefined;

    return this.modelService.searchMeasures(index, request.getSearchParams());
  }

  async updateAsset(
    request: KuzzleRequest,
  ): Promise<ApiModelUpdateAssetResult> {
    const engineGroups = request.getArray("engineGroups", []) || ["commons"];
    const index = request.input.args.index as string | undefined;
    const model = request.getString("model");
    const metadataMappings = request.getBodyObject("metadataMappings", {});
    const defaultValues = request.getBodyObject("defaultValues", {});
    const measures = request.getBodyArray("measures", []);
    const metadataDetails = request.getBodyObject("metadataDetails", {});
    const metadataGroups = request.getBodyObject("metadataGroups", {});
    const tooltipModels = request.getBodyObject("tooltipModels", {});
    const locales = request.getBodyObject("locales", {});
    const icon = request.input.body?.icon as string | undefined;

    const updatedAssetModel = await this.modelService.updateAsset(
      engineGroups,
      index,
      model,
      metadataMappings,
      defaultValues,
      metadataDetails,
      metadataGroups,
      measures,
      tooltipModels,
      locales,
      icon,
      request,
    );

    return updatedAssetModel;
  }
}
