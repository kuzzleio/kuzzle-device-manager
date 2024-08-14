import { JSONObject } from "kuzzle-sdk";

import {
  DigitalTwinContent,
  DigitalTwinMeasures,
  Metadata,
} from "../../shared";

/**
 * Device document content
 */
export interface DeviceContent<
  TMeasures extends JSONObject = any,
  TMetadata extends Metadata = any,
> extends DigitalTwinContent<TMetadata> {
  /**
   * Linked asset unique identifier
   */
  assetId: string | null;

  /**
   */
  engineId: string;

  measures: DigitalTwinMeasures<TMeasures>;

  lastMeasuredAt: number;
}
