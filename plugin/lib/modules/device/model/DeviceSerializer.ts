import { KDocument } from "kuzzle-sdk";

import { DeviceContent } from "../types/DeviceContent";

export class DeviceSerializer {
  static id(model: string, reference: string) {
    return `${model}-${reference}`;
  }

  static serialize(device: KDocument<DeviceContent>): KDocument<DeviceContent> {
    return {
      _id: device._id,
      _source: device._source,
    };
  }
}
