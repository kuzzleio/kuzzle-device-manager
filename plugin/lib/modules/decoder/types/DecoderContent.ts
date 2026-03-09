import { NamedMeasures } from "../Decoder";

export interface DecoderContent {
  deviceModel: string;
  action?: string;

  measures: NamedMeasures;
}
