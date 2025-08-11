import { User } from "kuzzle";
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
export type AskDigitalTwinLink = {
  name:
    | "ask:device-manager:device:link-asset"
    | "ask:device-manager:asset:link-device";
  payload: {
    engineId: string;
    assetId: string;
    deviceId: string;
    user: User;
    measureSlots: { asset: string; device: string }[];
    implicitMeasuresLinking: undefined | boolean;
  };

  result: void;
};

export type AskDigitalTwinUnlink = {
  name:
    | `ask:device-manager:asset:unlink-device`
    | `ask:device-manager:device:unlink-asset`;

  payload: {
    deviceId: string;
    assetId: string;
    measureSlots: { asset: string; device: string }[];
    allMeasures: undefined | boolean;
    user: User;
  };

  result: void;
};
