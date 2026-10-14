import { PreconditionError } from "kuzzle";
import { JSONObject } from "kuzzle-sdk";

import {
  Decoder,
  DecodedPayload,
  DecoderValidationResult,
} from "../../../index";

export class EmptyTempDecoder extends Decoder {
  public measures = [];

  constructor() {
    super();

    this.payloadsMappings = {
      deviceEUI: { type: "keyword" },
    };
  }

  async validate(rawPayload: JSONObject): Promise<DecoderValidationResult> {
    if (rawPayload.measurements && rawPayload.measurements.length === 0) {
      return { reason: "No measurements", status: "invalid" };
    }

    const payloads: any[] = rawPayload.measurements ?? [rawPayload];

    for (const payload of payloads) {
      if (!payload.deviceEUI) {
        throw new PreconditionError('Invalid payload: missing "deviceEUI"');
      }

      if (payload.invalid) {
        return {
          customData: { deviceEUI: payload.deviceEUI },
          reason: "Payload flagged as invalid",
          status: "invalid",
        };
      }
    }

    return { status: "valid" };
  }

  async decode(
    decodedPayload: DecodedPayload<EmptyTempDecoder>,
    rawPayload: JSONObject,
  ): Promise<DecodedPayload<EmptyTempDecoder>> {
    this.log.info(`Decoding payload ${rawPayload.deviceEUI}`);

    if (rawPayload.metadata?.color) {
      decodedPayload.addMetadata(rawPayload.deviceEUI, {
        color: rawPayload.metadata.color,
      });
    }

    return decodedPayload;
  }
}
