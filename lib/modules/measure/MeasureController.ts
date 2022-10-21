import { ControllerDefinition, KuzzleRequest } from "kuzzle";

import { MeasureService } from "./MeasureService";

export class MeasureController {
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

  async push(request: KuzzleRequest) {
    const engineId = request.getString("engineId");
    const assetId = request.getBodyString("assetId");
    const measure = request.getBodyObject("measure");
    const refresh = request.getRefresh();
    const kuid = request.getKuid();

    await this.measureService.registerByAsset(
      engineId,
      assetId,
      measure as any,
      kuid,
      { refresh },
    );
  }
}