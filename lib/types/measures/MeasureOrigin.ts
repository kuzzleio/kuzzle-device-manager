/**
 * Represent the origin of a measure
 */
export interface MeasureOrigin {
  /**
   * ID of the device (document _id)
   */
  id?: string;

  /**
   * E.g. "device"
   */
  type: OriginType;

  /**
   * E.g. "AbeewayTemp"
   */
  model: string;

  /**
   * Array of payload uuids that were used to create this measure.
   */
  payloadUuids: string[];

  /**
   * Asset ID linked to the device when the measure was made
   */
  assetId?: string;
}

export enum OriginType {
  DEVICE = 'device',
  ASSET = 'asset'
}
