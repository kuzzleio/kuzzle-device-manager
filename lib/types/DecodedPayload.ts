import { Measurement } from './measures/MeasureContent';

/**
 * Result of the `Decoder.decode` method.
 *
 * Contains the decoded measurements.
 *
 * @example
 * const decodedPayload: DecodedPayload = new Map([
 *   [
 *     'BZH42AZF',
 *     [
 *       {
 *         deviceMeasureName: 'battery',
 *         measuredAt: Date.now(),
 *         type: 'battery',
 *         values: { battery: 32 },
 *       },
 *       {
 *         deviceMeasureName: 'internal_temperature',
 *         measuredAt: Date.now(),
 *         type: 'temperature',
 *         values: { temperature: -3 },
 *       },
 *       {
 *         deviceMeasureName: 'external_temperature',
 *         measuredAt: Date.now(),
 *         type: 'temperature',
 *         values: { temperature: 39 },
 *       },
 *     ]
 *   ],
 *   [
 *     'IS7L8HK',
 *     [
 *       {
 *         deviceMeasureName: 'battery',
 *         measuredAt: 1655379939496,
 *         type: 'battery',
 *         values: { battery: 92 },
 *       },
 *       {
 *         deviceMeasureName: 'internal_temperature',
 *         measuredAt: 1655379939496,
 *         type: 'temperature',
 *         values: { temperature: -3 },
 *       },
 *       {
 *         deviceMeasureName: 'external_temperature',
 *         measuredAt: 1655379939496,
 *         type: 'temperature',
 *         values: { temperature: 39 },
 *       },
 *     ]
 *   ]
 * ]);
 */
export type DecodedPayload = Map<string,  // deviceReference
  Measurement[]>;
