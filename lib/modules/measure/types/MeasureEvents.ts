import { Asset } from "../../../modules/asset";
import { Device } from "../../../modules/device";
import { DecodedPayload } from "../../../modules/decoder";

import { MeasureContent } from "./MeasureContent";

export type EventMeasureIngest = {
  name: "device-manager:measures:ingest";

  args: [
    {
      deviceModel: string;
      decodedPayload: DecodedPayload;
      payloadUuids: string[];
      refresh?: string;
    }
  ];
};

export type EventMeasureProcessBefore = {
  name: "device-manager:measures:process:before";

  args: [
    {
      asset: Asset;
      device: Device;
      measures: MeasureContent[];
    }
  ];
};

export type TenantEventMeasureProcessBefore = {
  name: `engine:${string}:device-manager:measures:process:before`;

  args: [
    {
      asset: Asset;
      device: Device;
      measures: MeasureContent[];
    }
  ];
};

export type EventMeasureProcessAfter = {
  name: "device-manager:measures:process:after";

  args: [
    {
      asset: Asset;
      device: Device;
      measures: MeasureContent[];
    }
  ];
};

export type TenantEventMeasureProcessAfter = {
  name: `engine:${string}:device-manager:measures:process:after`;

  args: [
    {
      asset: Asset;
      device: Device;
      measures: MeasureContent[];
    }
  ];
};
