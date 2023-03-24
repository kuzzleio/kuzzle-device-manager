import { ControllerDefinition, KuzzleRequest } from "kuzzle";

import { DecodersRegister } from "./DecodersRegister";
import { PayloadService } from "./PayloadService";
import {
  ApiDecoderListResult,
  ApiDecoderPrunePayloadsResult,
} from "./types/DecoderApi";

export class DecodersController {
  private payloadService: PayloadService;
  private decodersRegister: DecodersRegister;

  public definition: ControllerDefinition;

  constructor(
    payloadService: PayloadService,
    decodersRegister: DecodersRegister
  ) {
    this.payloadService = payloadService;
    this.decodersRegister = decodersRegister;

    this.definition = {
      actions: {
        list: {
          handler: this.list.bind(this),
          http: [{ path: "device-manager/decoders", verb: "get" }],
        },
        prunePayloads: {
          handler: this.prunePayloads.bind(this),
          http: [
            { path: "device-manager/decoders/_prunePayloads", verb: "delete" },
          ],
        },
      },
    };
  }

  /**
   * List all available decoders
   */
  async list(): Promise<ApiDecoderListResult> {
    const decoders = this.decodersRegister.list();

    return { decoders };
  }

  /**
   * Clean payload collection for a time period
   */
  async prunePayloads(
    request: KuzzleRequest
  ): Promise<ApiDecoderPrunePayloadsResult> {
    const days = request.getBodyNumber("days");
    const deviceModel = request.input.body.deviceModel;
    const onlyValid = request.input.body.onlyValid ?? true;

    const deleted = await this.payloadService.prune(days, onlyValid, {
      deviceModel,
    });

    return { deleted };
  }
}
