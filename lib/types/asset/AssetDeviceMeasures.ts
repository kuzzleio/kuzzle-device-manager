import { DeviceMeasures } from '../device/DeviceMeasures';
import { AssetMeasureOrigin } from './AssetMeasureOrigin';

type AssetDeviceMeasuresBuilder<Type> = {
  [Properties in keyof Type]: Type[Properties] & { origin: AssetMeasureOrigin }
}

/**
 * Object containing the measures sent by the devices.
 *
 * @example
 *
 * {
 *   temperature: {
 *     origin: {
 *       id: 'Abeeway-12345',
 *       model: 'Abeeway',
 *       reference: '12345',
 *       qos: {
 *         battery: 87
 *       }
 *     },
 *     updatedAt: 1634310003305,
 *     degree: 27.6,
 *   },
 *   ...
 * }
 *
 */
export type AssetDeviceMeasures = AssetDeviceMeasuresBuilder<DeviceMeasures>;
