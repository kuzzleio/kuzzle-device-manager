import { KuzzleLogger } from "kuzzle-logger";

import { DeviceManagerPlugin } from "../plugin";
import { Module } from "../shared/Module";

import { MeasureAdapterService } from "./MeasureAdapterService";
import { MeasureAdaptersController } from "./MeasureAdaptersController";
import { RoleMeasureAdaptersAdmin } from "./roles/RoleMeasureAdaptersAdmin";
import { RoleMeasureAdaptersReader } from "./roles/RoleMeasureAdaptersReader";

export class MeasureAdapterModule extends Module {
  private measureAdapterService: MeasureAdapterService;
  private measureAdaptersController: MeasureAdaptersController;
  readonly logger: KuzzleLogger;

  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);
    this.logger = this.plugin.context.logger.child("measure-adapters-module");
  }

  private get decodersRegister() {
    // eslint-disable-next-line dot-notation
    return this.plugin["decodersRegister"];
  }

  public async init(): Promise<void> {
    this.measureAdapterService = new MeasureAdapterService(
      this.plugin,
      this.decodersRegister,
      this.logger,
    );
    this.measureAdaptersController = new MeasureAdaptersController(
      this.measureAdapterService,
      this.logger,
    );

    this.plugin.api["device-manager/measureAdapters"] =
      this.measureAdaptersController.definition;

    this.plugin.imports.roles[RoleMeasureAdaptersAdmin.name] =
      RoleMeasureAdaptersAdmin.definition;
    this.plugin.imports.roles[RoleMeasureAdaptersReader.name] =
      RoleMeasureAdaptersReader.definition;
  }
}
