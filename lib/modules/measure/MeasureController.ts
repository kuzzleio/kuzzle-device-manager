import { BadRequestError, ControllerDefinition, KuzzleRequest } from "kuzzle";

import { MeasureService } from "./MeasureService";
import { isSourceAPI } from "./types/MeasureSources";
import { IngestExternalMeasuresResult } from "./types/MeasureApi";
import { getValidator } from "../shared/utils/AJValidator";
import { DecodedMeasurement } from "./exports";

export class MeasureController {
  private measureService: MeasureService;

  public definition: ControllerDefinition;

  constructor(measureService: MeasureService) {
    this.measureService = measureService;

    this.definition = {
      actions: {
        ingestExternal: {
          handler: this.ingestExternal.bind(this),
          http: [{ path: "device-manager/measures/ingest", verb: "post" }],
        },
      },
    };
  }

  async ingestExternal(
    request: KuzzleRequest,
  ): Promise<IngestExternalMeasuresResult> {
    const source = request.getBodyObject("dataSource");
    const measure = request.getBodyObject("measure") as DecodedMeasurement;

    if (isSourceAPI(source)) {
      const validator = getValidator(measure.type);

      if (validator) {
        const valid = validator(measure.values);

        if (!valid) {
          throw new BadRequestError(validator.errors);
        }
      }

      await this.measureService.ingestAPI(source, measure);
    } else {
      throw new BadRequestError(
        "Provided dataSource does not match the API source format",
      );
    }
  }
}
