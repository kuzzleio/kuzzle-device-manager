import { JSONObject } from "kuzzle";
import { DecodedMeasurement } from "./MeasureContent";
import { MeasureSource } from "./MeasureSources";

interface MeasuresControllerRequest {
  controller: "device-manager/measures";
}

export interface IngestExternalMeasuresRequest
  extends MeasuresControllerRequest {
  action: "ingestFromSource";

  body: {
    dataSource: MeasureSource;

    measure: DecodedMeasurement<JSONObject>[];
  };
}

export type IngestExternalMeasuresResult = void;
