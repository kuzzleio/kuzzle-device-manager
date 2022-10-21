import { DecoderController } from "../DecoderController";

interface DecoderControllerRequest {
  controller: "device-manager/decoders";
}

export interface ApiDecoderListRequest extends DecoderControllerRequest {
  action: "list";

  _id: string;
}
export type ApiDecoderListResult = ReturnType<DecoderController["list"]>;

export interface ApiDecoderPrunePayloadsRequest
  extends DecoderControllerRequest {
  action: "prunePayloads";

  _id: string;
}
export type ApiDecoderPrunePayloadsResult = ReturnType<
  DecoderController["prunePayloads"]
>;
