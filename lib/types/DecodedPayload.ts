import { BasePayloadMeasure } from './measures/Measure';

/**
 * Result of the `Decoder.decode` method.
 *
 * Contains the decoded measures.
 *
 * @example
 *
 *  const decodedPayload: DecodedPayload = {
 *    reference: 'BZH42AZF',
 *    measures: {
 *      temperature: {
 *        measuredAt: Date.now(),
 *        values: {
 *          temperature: 23.8,
 *        }
 *      },
 *      position: {
 *        measuredAt: Date.now(),
 *        values: {
 *          position: {
 *            lat: 21.297,
 *            lon: 4.8421,
 *          },
 *          accuracy: 100,
 *        }
 *      },
 *    },
 *  };
 */
export interface DecodedPayload {
  /**
   * Device unique reference
   */
  reference: string;

  /**
   * Array of decoded measures.
   */
  measures: {
    [measureType: string]: BasePayloadMeasure,
  };
}
