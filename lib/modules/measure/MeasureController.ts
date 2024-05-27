import { BadRequestError, ControllerDefinition, KuzzleRequest } from "kuzzle";

import { MeasureService } from "./MeasureService";
import { isSourceAPI } from "./types/MeasureSources";
import { IngestExternalMeasuresResult } from "./types/MeasureApi";
import { getValidator } from "../shared/utils/AJValidator";
import { DecodedMeasurement } from "./exports";
import { SchemaValidationError } from "../shared/errors/SchemaValidationError";

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
    source.type = "api";
    const measures = request.getBodyArray("measures") as DecodedMeasurement[];

    if (isSourceAPI(source)) {
      for (const measure of measures) {
        const validator = getValidator(measure.type);

        if (validator) {
          const valid = validator(measure.values);

          if (!valid) {
            throw new SchemaValidationError(
              "Provided measures does not respect theirs respective schemas",
              validator.errors,
            );
          }
        }
      }

      await this.measureService.ingestAPI(source, measures, []);
    } else {
      throw new BadRequestError(
        "Provided dataSource does not match the API source format",
      );
    }
  }
}
