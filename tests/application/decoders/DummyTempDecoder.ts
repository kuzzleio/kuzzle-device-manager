import { PreconditionError } from "kuzzle";
import { JSONObject } from "kuzzle-sdk";

import {
  Decoder,
  DecodedPayload,
  TemperatureMeasurement,
  BatteryMeasurement,
} from "../../../index";

export class DummyTempDecoder extends Decoder {
  public measures = [
    { name: "temperature", type: "temperature" },
    { name: "battery", type: "battery" },
  ] as const;

  constructor() {
    super();

    this.payloadsMappings = {
      deviceEUI: { type: "keyword" },
    };
  }

  async validate(payload: JSONObject) {
    if (!payload.deviceEUI) {
      throw new PreconditionError('Invalid payload: missing "deviceEUI"');
    }

    if (payload.invalid) {
      return false;
    }

    return true;
  }

  async decode(
    decodedPayload: DecodedPayload<DummyTempDecoder>,
    payload: JSONObject
  ): Promise<DecodedPayload<DummyTempDecoder>> {
    if (payload?.metadata?.color) {
      decodedPayload.addMetadata(payload.deviceEUI, {
        color: payload.metadata.color,
      });
    }

    decodedPayload.addMeasurement<TemperatureMeasurement>(
      payload.deviceEUI,
      "temperature",
      {
        measuredAt: payload.measuredAt || Date.now(),
        type: "temperature",
        values: {
          temperature: payload.temperature,
        },
      }
    );

    decodedPayload.addMeasurement<BatteryMeasurement>(
      payload.deviceEUI,
      "battery",
      {
        measuredAt: payload.measuredAt || Date.now(),
        type: "battery",
        values: {
          battery: payload.battery || 42,
        },
      }
    );

    if (payload.unknownMeasure) {
      decodedPayload.addMeasurement<TemperatureMeasurement>(
        payload.deviceEUI,
        // @ts-expect-error
        "unknownMeasureName",
        {
          measuredAt: Date.now(),
          type: "temperature",
          values: {
            temperature: payload.unknownMeasure,
          },
        }
      );
    }

    return decodedPayload;
  }
}
