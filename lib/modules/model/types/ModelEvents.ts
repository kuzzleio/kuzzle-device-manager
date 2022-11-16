import { AssetModelContent, DeviceModelContent } from "./ModelContent";

export type AskModelAssetGet = {
  name: "ask:device-manager:model:asset:get";

  payload: { engineGroup: string; model: string };

  result: AssetModelContent;
};

export type AskModelDeviceGet = {
  name: "ask:device-manager:model:device:get";

  payload: { model: string };

  result: DeviceModelContent;
};
