/**
 * Base mesure type
 */
export interface BaseMeasure {
  /**
   * Date of the measure (UNIX timestamp format)
   */
  updatedAt: number;

  /**
   * UUID of the payload used to make this measure
   *
   * (This is auto-filled by Kuzzle)
   */
  payloadUuid?: string;
}
