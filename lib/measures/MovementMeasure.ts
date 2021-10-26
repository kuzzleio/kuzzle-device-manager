import { BaseMeasure } from './BaseMeasure';

/**
 * Represent a movement measure
 */
export interface MovementMeasure extends BaseMeasure {
  moving: boolean;
}

export interface DeviceMovementMeasures {
  movement?: MovementMeasure;
}

export const movementMeasureMappings = {
  moving: { type: 'boolean' },
};
