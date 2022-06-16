import { DeviceLink } from './BaseAssetContent';

/**
 * Represents a request to link a device to an engine
 */
export type AttachRequest = {
  deviceId: string;

  engineId: string;
}

/**
 * Represents a request to link a device to an asset
 *
 * @example
 * {
 *   deviceId: 'Abeeway-4263232',
 *   assetId: 'container-xlarger-HSZJSZ',
 *   measuresNames: {
 *     temperature: 'External temperature',
 *     position: 'Lora Position'
 *   }
 * }
 */
export type LinkRequest = {
  assetId: string;
  deviceLink: DeviceLink;
}
