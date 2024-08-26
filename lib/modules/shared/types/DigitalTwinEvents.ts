import { MeasureContent } from "../../measure";

export type AskDigitalTwinLastMeasuresGet = {
  name:
    | "ask:device-manager:asset:get-last-measures"
    | "ask:device-manager:device:get-last-measures";

  payload: {
    engineId: string;
    digitalTwinId: string;
  };

  result: MeasureContent[];
};
