import { DeviceManagerPlugin } from "../plugin";
import { Module } from "../shared/Module";

import { DecodersController } from "./DecodersController";
import { PayloadsController } from "./PayloadsController";
import { PayloadService } from "./PayloadService";
import { RoleDecodersAdmin } from "./roles/RoleDecodersAdmin";
import { RolePayloadsAll } from "./roles/RolePayloadsAll";
import { KuzzleLogger } from "kuzzle-logger";

export class DecoderModule extends Module {
  private payloadService: PayloadService;
  private decoderController: DecodersController;
  private payloadsController: PayloadsController;
  readonly decoderLogger: KuzzleLogger;
  readonly payloadLogger: KuzzleLogger;

  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);
    this.decoderLogger = this.plugin.context.logger.child("decoders");
    this.payloadLogger = this.plugin.context.logger.child("payloads");
  }

  // @todo temporary until registers refactor
  private get decodersRegister() {
    // eslint-disable-next-line dot-notation
    return this.plugin["decodersRegister"];
  }

  public async init(): Promise<void> {
    this.payloadService = new PayloadService(this.plugin, this.payloadLogger);
    this.decoderController = new DecodersController(
      this.payloadService,
      this.decodersRegister,
      this.decoderLogger,
    );
    this.payloadsController = new PayloadsController(
      this.payloadService,
      this.decodersRegister,
      this.payloadLogger,
    );

    this.plugin.api["device-manager/decoders"] =
      this.decoderController.definition;

    this.plugin.api["device-manager/payloads"] =
      this.payloadsController.definition;

    this.plugin.imports.roles[RoleDecodersAdmin.name] =
      RoleDecodersAdmin.definition;
    this.plugin.imports.roles[RolePayloadsAll.name] =
      RolePayloadsAll.definition;
  }
}
