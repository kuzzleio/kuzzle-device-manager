import { KDocument } from "kuzzle-sdk";

import { DeviceContent } from "../../device";
import { DecodedMeasurement } from "../../measure";

/**
 * @internal
 */
export type AskPayloadReceiveFormated = {
  name: "ask:device-manager:payload:receive-formated";

  payload: {
    device: KDocument<DeviceContent>;
    measures: DecodedMeasurement[];
    payloadUuids: string[];
  };

  result: void;
};
