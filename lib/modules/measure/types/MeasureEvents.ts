import { DecodedPayload } from "../../../modules/decoder";

export type EventMeasureIngest = {
  name: 'device-manager:measure:ingest';

  args: [{
    deviceModel: string,
    decodedPayload: DecodedPayload,
    payloadUuids: string[],
    options: {
      refresh?: string;
    }
  }];
}
