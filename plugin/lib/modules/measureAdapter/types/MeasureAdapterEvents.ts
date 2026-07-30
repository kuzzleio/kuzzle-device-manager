import { MeasureAdapterContent } from "./MeasureAdapterContent";

/**
 * Fetch a Measure Adapter document by id, scoped to an engine (tenant).
 */
export type AskMeasureAdapterGet = {
  name: "ask:device-manager:measureAdapter:get";

  payload: { engineId: string; measureAdapterId: string };

  result: MeasureAdapterContent;
};
