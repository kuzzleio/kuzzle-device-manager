import { DecoderContent } from "./DecoderContent";

interface DecoderControllerRequest {
  controller: "device-manager/decoders";
}

export interface ApiDecoderListRequest extends DecoderControllerRequest {
  action: "list";

  _id: string;
}
export type ApiDecoderListResult = {
  decoders: DecoderContent[];
};

export interface ApiDecoderPrunePayloadsRequest
  extends DecoderControllerRequest {
  action: "prunePayloads";

  _id: string;
}
export type ApiDecoderPrunePayloadsResult = {
  deleted: number;
};
