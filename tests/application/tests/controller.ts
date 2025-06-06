import { Backend, Controller, KuzzleRequest } from "kuzzle";

import {
  ApiAssetCreateRequest,
  ApiAssetCreateResult,
  ApiDeviceCreateRequest,
  ApiDeviceCreateResult,
} from "../../../index";

export class TestsController extends Controller {
  constructor(app: Backend) {
    super(app);

    this.definition = {
      actions: {
        createDigitalTwinFromBackend: {
          handler: this.createDigitalTwinFromBackend,
        },
        setAssetsHistorizesMeasuresConfig: {
          handler: this.setAssetsHistorizesMeasuresConfig,
        },
      },
    };
  }

  async setAssetsHistorizesMeasuresConfig(request: KuzzleRequest) {
    this.app.plugin.get("device-manager").config.assetsHistorizesMeasures =
      request.getBoolean("assetsHistorizesMeasures");
  }

  async createDigitalTwinFromBackend(request: KuzzleRequest) {
    const engineId = request.getString("engineId");
    const reference = request.getBodyString("reference");

    await this.app.sdk.query<ApiAssetCreateRequest, ApiAssetCreateResult>({
      controller: "device-manager/assets",
      action: "create",
      engineId,
      body: {
        model: "Container",
        reference,
      },
    });

    await this.app.sdk.query<ApiDeviceCreateRequest, ApiDeviceCreateResult>({
      controller: "device-manager/devices",
      action: "create",
      engineId,
      body: {
        model: "DummyTemp",
        reference,
      },
    });
  }
}
