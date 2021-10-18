import { BaseMeasure } from './BaseMeasure';

/**
 * Represents a position measure
 */
export interface PositionMeasure extends BaseMeasure {
  /**
   * GPS coordinates
   */
  point: {
    lat: number;
    lon: number;
  };

  /**
   * Altitude in meters
   */
  altitude?: number;

  /**
   * Measure precision in meters
   */
  accuracy?: number;
}

export interface DevicePositionMeasures {
  position?: PositionMeasure
}

export const positionMeasureMappings = {
  // position
  point: { type: 'geo_point' },
  altitude: { type: 'integer' },
  accuracy: { type: 'integer' },
};
