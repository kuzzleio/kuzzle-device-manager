import { PreconditionError } from "kuzzle";
import { JSONObject } from "kuzzle-sdk";

import { Decoder, DecodedPayload } from "../../../index";

export class EmptyTempDecoder extends Decoder {
  public measures = [];

  constructor() {
    super();

    this.payloadsMappings = {
      deviceEUI: { type: "keyword" },
    };
  }

  async validate(rawPayload: JSONObject) {
    if (rawPayload.measurements && rawPayload.measurements.length === 0) {
      return false;
    }

    const payloads: any[] = rawPayload.measurements ?? [rawPayload];

    return payloads.every((payload) => {
      if (!payload.deviceEUI) {
        throw new PreconditionError('Invalid payload: missing "deviceEUI"');
      }

      return !payload.invalid;
    });
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
