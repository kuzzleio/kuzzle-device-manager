import { DeviceLink } from "./DeviceLink";

/**
 * Represents a request to link a device to an engine
 */
export type AttachRequest = {
  deviceId: string;

  engineId: string;
};

/**
 * Represents a request to link a device to an asset
 *
 * @example
 * {
 *   deviceId: 'Abeeway-4263232',
 *   assetId: 'container-xlarger-HSZJSZ',
 *   measuresNamesLinks: {
 *     temperature: 'External temperature',
 *     position: 'Lora Position'
 *   }
 * }
 */
export type LinkRequest = DeviceLink & {
  engineId: string;

  assetId: string;
};
