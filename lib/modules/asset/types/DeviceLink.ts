/**
 * A jointure link with a device and a match between
 * `deviceMeasureName` and generated `assetMeasureName`
 */
export type DeviceLink = {
  deviceId: string;

   measureNamesLinks: Array<{
    assetMeasureName: string;
    deviceMeasureName: string;
  }>;
}
