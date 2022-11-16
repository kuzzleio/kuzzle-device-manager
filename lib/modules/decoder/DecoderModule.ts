import { KuzzleRequest } from "kuzzle";

import { Module } from "../shared/Module";

import { DecodersController } from "./DecodersController";
import { PayloadService } from "./PayloadService";
import { decodersAdmin } from "./roles/decodersAdmin";

export class DecoderModule extends Module {
  private payloadService: PayloadService;
  private decoderController: DecodersController;

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

    this.plugin.api["device-manager/decoders"] =
      this.decoderController.definition;

    this.plugin.api["device-manager/payload"] =
      this.decodersRegister.getPayloadController(this.payloadService);

    this.plugin.api["device-manager/payload"].actions.generic = {
      handler: this.unknowPayload.bind(this),
      http: [{ path: "device-manager/payload/:device", verb: "post" }],
    };

    this.plugin.roles["decoders.admin"] = decodersAdmin;
  }

  async unknowPayload(request: KuzzleRequest) {
    const body = request.getBody();
    const device = request.getString("device");
    const documentContent = {
      deviceModel: device,
      rawPayload: body,
    };
    this.sdk.document.create(
      this.plugin.config.adminIndex,
      "payloads",
      documentContent
    );
  }
}
