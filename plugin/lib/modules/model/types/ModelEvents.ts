import {
  AssetModelContent,
  DeviceModelContent,
  GroupModelContent,
  MeasureAdapterModelContent,
  MeasureModelContent,
} from "./ModelContent";

export type AskModelAssetGet = {
  name: "ask:device-manager:model:asset:get";

  payload: { engineGroups: string[]; engineId?: string; model: string };

  result: AssetModelContent;
};

export type AskModelDeviceGet = {
  name: "ask:device-manager:model:device:get";

  payload: { model: string };

  result: DeviceModelContent;
};

export type AskModelMeasureGet = {
  name: "ask:device-manager:model:measure:get";

  payload: { type: string; engineId?: string };

  result: MeasureModelContent;
};

export type AskModelGroupGet = {
  name: "ask:device-manager:model:group:get";

  payload: { model: string };

  result: GroupModelContent;
};

export type AskModelMeasureAdapterGet = {
  name: "ask:device-manager:model:measureAdapter:get";

  payload: { _id: string };

  result: MeasureAdapterModelContent["measureAdapter"];
};
