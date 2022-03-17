import { Measurement } from './measures/Measurement';

export interface DecodedPayload {
  /**
   * Device unique reference
   */
  reference: string;

  /**
   * Array of decoded measures.
   */
  measures: {
    [measureType: string]: Measurement,
  };
}
