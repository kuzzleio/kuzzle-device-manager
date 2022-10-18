import { MetadataValue } from "../../asset";
import { Device } from "../Device";

export type EventDeviceUpdateBefore = {
  name: 'device-manager:device:update:before';

  args: [{ device: Device, metadata: MetadataValue }];
}

export type EventDeviceUpdateAfter = {
  name: 'device-manager:device:update:after';

  args: [{ device: Device, metadata: MetadataValue }];
}
