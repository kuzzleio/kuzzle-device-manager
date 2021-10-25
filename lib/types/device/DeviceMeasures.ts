import {
  DeviceTemperatureMeasures,
  DeviceMovementMeasures,
  DevicePositionMeasures,
} from '../../measures';

/**
 * Object containing the devices measures
 *
 * @example
 *
{
  temperature: {
    updatedAt: 1634310003305,
    degree: 27.6,
  },
  ...
}
 *
 */
export interface DeviceMeasures extends
  DeviceTemperatureMeasures,
  DeviceMovementMeasures,
  DevicePositionMeasures
{
  // Each measure should open this interface and add it's own properties here
}
