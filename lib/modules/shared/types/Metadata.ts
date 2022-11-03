export type MetadataValue =
  | boolean
  | number
  | string
  | { lat: number; lon: number };

export type Metadata = Record<
  string,
  MetadataValue | Record<string, MetadataValue>
>;
