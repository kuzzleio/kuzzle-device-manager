import { ControllerDefinition, KuzzleRequest } from "kuzzle";

import { DecodersRegister } from "../../core/registers/DecodersRegister";

import { PayloadService } from "./PayloadService";

export class DecoderController {
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
      },
    };
  }

  /**
   * List all available decoders
   */
  async list() {
    const decoders = this.decodersRegister.list();

    return { decoders };
  }

  /**
   * Clean payload collection for a time period
   */
  async prunePayloads(request: KuzzleRequest) {
    const days = request.getBodyNumber("days");
    const deviceModel = request.input.body.deviceModel;
    const onlyValid = request.input.body.onlyValid ?? true;

    const deleted = await this.payloadService.prune(days, onlyValid, {
      deviceModel,
    });

    return { deleted };
  }
}
