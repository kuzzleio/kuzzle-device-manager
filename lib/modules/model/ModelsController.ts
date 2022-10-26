import { ControllerDefinition, KuzzleRequest } from "kuzzle";

import { MeasureUnit } from "../measure";
import { ModelService } from "./ModelService";
import {
  ApiModelCreateAssetResult,
  ApiModelCreateDeviceResult,
  ApiModelCreateMeasureResult,
} from "./types/ModelApi";

export class ModelsController {
  private modelService: ModelService;

  public definition: ControllerDefinition;

  constructor(modelService: ModelService) {
    this.modelService = modelService;

    this.definition = {
      actions: {
        createAsset: {
          handler: this.createAsset.bind(this),
          http: [{ path: "device-manager/models/assets", verb: "post" }],
        },
        createDevice: {
          handler: this.createDevice.bind(this),
          http: [{ path: "device-manager/models/devices", verb: "post" }],
        },
        createMeasure: {
          handler: this.createMeasure.bind(this),
          http: [{ path: "device-manager/models/measures", verb: "post" }],
        },
        // updateAsset: {
        //   handler: this.updateAsset.bind(this),
        //   http: [{ path: "device-manager/models/asset/:_id", verb: "patch" }],
        // },
        // updateDevice: {
        //   handler: this.updateDevice.bind(this),
        //   http: [{ path: "device-manager/models/device/:_id", verb: "patch" }],
        // },
        // updateMeasure: {
        //   handler: this.updateMeasure.bind(this),
        //   http: [{ path: "device-manager/models/measure/:_id", verb: "patch" }],
        // },
      },
    };
  }

  async createAsset(
    request: KuzzleRequest
  ): Promise<ApiModelCreateAssetResult> {
    const engineGroup = request.getBodyString("engineGroup");
    const model = request.getBodyString("model");
    const metadataMappings = request.getBodyObject("metadataMappings");

    const assetModel = await this.modelService.createAsset(
      model,
      metadataMappings,
      {
        engineGroup,
      }
    );

    return assetModel;
  }

  async createDevice(
    request: KuzzleRequest
  ): Promise<ApiModelCreateDeviceResult> {
    const model = request.getBodyString("model");
    const metadataMappings = request.getBodyObject("metadataMappings");

    const deviceModel = await this.modelService.createDevice(
      model,
      metadataMappings
    );

    return deviceModel;
  }

  async createMeasure(
    request: KuzzleRequest
  ): Promise<ApiModelCreateMeasureResult> {
    const name = request.getBodyString("name");
    const unit = request.getBodyObject("unit", {}) as MeasureUnit;
    const valuesMappings = request.getBodyObject("valuesMappings");

    const measureModel = await this.modelService.createMeasure(
      name,
      unit,
      valuesMappings
    );

    return measureModel;
  }
}
