import { JSONObject } from "kuzzle-sdk";

export type MetadataValue =
  | boolean
  | number
  | string
  | { lat: number; lon: number }
  | null
  | JSONObject;

export type Metadata = Record<
  string,
  MetadataValue | Record<string, MetadataValue>
>;
