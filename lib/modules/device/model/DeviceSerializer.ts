import { KDocument } from "kuzzle";

import { Device } from "./Device";
import { DeviceContent } from "../types/DeviceContent";

export class DeviceSerializer {
  static id(model: string, reference: string) {
    return `${model}-${reference}`;
  }

  static serialize(device: Device): KDocument<DeviceContent> {
    return {
      _id: device._id,
      _source: device._source,
    };
  }
}
