import { Measurement } from './measures/MeasureContent';

/**
 * Record containing decoded measurements for each device.
 *
 * Record<deviceReference, Measurement[]>
 *
 * @example
 * const decodedPayload: DecodedPayload = {
 *   'BZH42AZF': [
 *     {
 *       deviceMeasureName: 'battery',
 *       measuredAt: 1655379939496,
 *       type: 'battery',
 *       values: { battery: 32 },
 *     },
 *   ],
 *   'IS7L8HK': [
 *     {
 *       deviceMeasureName: 'internal_temperature',
 *       measuredAt: 1655379939496,
 *       type: 'temperature',
 *       values: { temperature: -3 },
 *     },
 *     {
 *       deviceMeasureName: 'external_temperature',
 *       measuredAt: 1655379939496,
 *       type: 'temperature',
 *       values: { temperature: 39 },
 *     },
 *   ],
 * };
 */
export type DecodedPayload = Record<string, Measurement[]>;
// @todo we should have an intermediary object
