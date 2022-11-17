import { KuzzleRequest } from "kuzzle";

import { Module } from "../shared/Module";

import { DecodersController } from "./DecodersController";
import { PayloadsController } from "./PayloadsController";
import { PayloadService } from "./PayloadService";
import { decodersAdmin } from "./roles/decodersAdmin";

export class DecoderModule extends Module {
  private payloadService: PayloadService;
  private decoderController: DecodersController;
  private payloadsController: PayloadsController;

  // @todo temporary until registers refactor
  private get decodersRegister() {
    // eslint-disable-next-line dot-notation
    return this.plugin["decodersRegister"];
  }

  public async init(): Promise<void> {
    this.payloadService = new PayloadService(this.plugin);
    this.decoderController = new DecodersController(
      this.payloadService,
      this.decodersRegister
    );
    this.payloadsController = new PayloadsController(
      this.payloadService,
      this.decodersRegister
    );

    this.plugin.api["device-manager/decoders"] =
      this.decoderController.definition;

    this.plugin.api["device-manager/payloads"] =
      this.payloadsController.definition;

    this.plugin.roles["decoders.admin"] = decodersAdmin;
  }
}
