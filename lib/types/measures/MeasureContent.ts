import { JSONObject } from 'kuzzle';
import { KDocumentContent } from 'kuzzle-sdk';

import { MeasurementUnit } from './MeasureDefinition';

/**
 * Represent the content of a measure document.
 */
export interface MeasureContent extends KDocumentContent {
  /**
   * Type of the measure. (e.g. "temperature")
   * The type name is also the name of the sub-property to look at
   * in the "values" object to get the measure main value.
   */
  type: string;

  /**
   * A device may have different measures for the same type (e.g. measure temperature 2 times)
   * Should be set when you link the device to the asset
   */
  name?: string;

  /**
   * Measurement self-description
   */
  unit: MeasurementUnit;

  /**
   * Mesured values
   */
  values: JSONObject;

  /**
   * Micro Timestamp of the measure
   */
  measuredAt: number;

  /**
   * Origin of the measure
   */
  origin: {
    /**
     * ID of the device (document _id)
     */
    id: string;

    /**
     * E.g. "device"
     */
    type: string;

    /**
     * E.g. "AbeewayTemp"
     */
    model: string;

    /**
     * Reference of the data source (e.g. a device manufacturer ID)
     */
    reference: string;

    /**
     * Array of payload uuids that were used to create this measure.
     */
    payloadUuids: string[];
  }
}
