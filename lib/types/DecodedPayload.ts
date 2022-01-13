import { Measure } from './measures/Measure';

export interface DecodedPayload {
  /**
   * Device unique reference
   */
  reference: string;

  /**
   * Array of decoded measures.
   */
  measures: {
    [measureType: string]: Measure,
  };
}
