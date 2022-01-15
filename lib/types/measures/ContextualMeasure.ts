import { JSONObject } from 'kuzzle';

import { MeasureUnit } from './MeasureDefinition';

export interface ContextualMeasure {
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
   * Measure self-description
   */
  unit: MeasureUnit;

  values: JSONObject;

  measuredAt: number;

  origin: {
    // ID of the device (document _id)
    id: string;

    // E.g. "device"
    type: string;

    // E.g. "AbeewayTemp"
    model: string;

    // Reference of the data source (e.g. a device manufacturer ID)
    reference: string;

    // Array of payload uuids that were used to create this measure.
    payloadUuids: string[];
  }
}

export const measuresMappings = {
  dynamic: 'strict',
  properties: {

    measuredAt: { type: 'float' },

    /**
     * A device may have different measures for the same type (e.g. measure temperature 2 times)
     * Should be set when you link the device to the asset
     */
    name: { type: 'keyword' },

    origin: {
      properties: {
        // ID of the device (document _id)
        id: { type: 'keyword' },


        // E.g. "AbeewayTemp"
        model: { type: 'keyword' },


        // Array of payload uuids that were used to create this measure.
        payloadUuids: { type: 'keyword' },


        // Reference of the data source (e.g. a device manufacturer ID)
        reference: { type: 'keyword' },


        // E.g. "device"
        type: { type: 'keyword' },
      }
    },


    /**
     * Type of the measure. (e.g. "temperature")
     * The type name is also the name of the sub-property to look at
     * in the "values" object to get the measure main value.
     */
    type: { type: 'keyword' },

    /**
     * Measure self-description
     */
    unit: {
      properties: {
        name: { type: 'keyword' },

        sign: { type: 'keyword' },

        type: { type: 'keyword' },
      }
    },

    values: {
      properties: {},
    }
  }
};
