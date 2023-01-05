import { JSONObject, PreconditionError } from "kuzzle";

import {
  Decoder,
  DecodedPayload,
  TemperatureMeasurement,
} from "../../../../index";

export class DummyTempDecoder extends Decoder {
  public measures = [{ name: "temperature", type: "temperature" }] as const;

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
