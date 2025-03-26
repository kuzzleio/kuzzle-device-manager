import { Module } from "../shared/Module";

import { RawPayloadsController } from "./RawPayloadsController";
import { RawPayloadsService } from "./RawPayloadsService";

export class RawPayloadsModule extends Module {
  private rawPayloadsService: RawPayloadsService;
  private rawPayloadsController: RawPayloadsController;

  public async init(): Promise<void> {
    this.rawPayloadsService = new RawPayloadsService(this.plugin);
    this.rawPayloadsController = new RawPayloadsController(
      this.rawPayloadsService,
    );

    this.plugin.api["device-manager/rawPayloads"] =
      this.rawPayloadsController.definition;
  }
}
