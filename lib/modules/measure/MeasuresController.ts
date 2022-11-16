import { ControllerDefinition, KuzzleRequest } from "kuzzle";

import { MeasureService } from "./MeasureService";
import { ApiMeasurePushResult } from "./types/MeasureApi";

export class MeasuresController {
  private measureService: MeasureService;

  public definition: ControllerDefinition;

  constructor(measureService: MeasureService) {
    this.measureService = measureService;

    this.definition = {
      actions: {
        push: {
          handler: this.push.bind(this),
          http: [{ path: "device-manager/:engineId/measures", verb: "post" }],
        },
      },
    };
  }

  async push(request: KuzzleRequest): Promise<ApiMeasurePushResult> {
    const engineId = request.getString("engineId");
    const assetId = request.getBodyString("assetId");
    const measure = request.getBodyObject("measure");
    const refresh = request.getRefresh();
    const kuid = request.getKuid();

    const asset = await this.measureService.registerByAsset(
      engineId,
      assetId,
      measure as any,
      kuid,
      { refresh }
    );

    return { asset };
  }
}
