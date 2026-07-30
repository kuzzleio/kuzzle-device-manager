import { MeasureAdapterContent } from "./MeasureAdapterContent";

export type AskMeasureAdapterGet = {
  name: "ask:device-manager:measureAdapter:get";

  payload: { engineId: string; measureAdapterId: string };

  result: MeasureAdapterContent;
};
