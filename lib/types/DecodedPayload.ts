import { Measurement } from './measures/MeasureContent';

/**
 * Result of the `Decoder.decode` method.
 *
 * Contains the decoded measures.
 *
 * @example
 *
 *  const decodedPayload: DecodedPayload = {
 *    reference: 'BZH42AZF',
 *    measures: [
 *      {
 *        type: temperature,
 *        measuredAt: Date.now(),
 *        values: {
 *          temperature: 23.8,
 *        }
 *      },
 *      {
 *        type: position,
 *        measuredAt: Date.now(),
 *        values: {
 *          position: {
 *            lat: 21.297,
 *            lon: 4.8421,
 *          },
 *          accuracy: 100,
 *        }
 *      },
 *    ],
 *  };
 */
export type DecodedPayload = Map<string, Measurement[]>;
