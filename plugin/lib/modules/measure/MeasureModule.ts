import { DeviceManagerPlugin } from "../plugin";
import { Module } from "../shared/Module";

import { MeasureService } from "./MeasureService";
import { RoleMeasuresAdmin } from "./roles/RoleMeasuresAdmin";
import { RoleMeasuresReader } from "./roles/RoleMeasuresReader";
import { KuzzleLogger } from "kuzzle-logger";

export class MeasureModule extends Module {
  private measureService: MeasureService;
  readonly logger: KuzzleLogger;

  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);
    this.logger = this.plugin.context.logger.child("measures");
  }

  public async init(): Promise<void> {
    this.measureService = new MeasureService(this.plugin, this.logger);

    this.plugin.imports.roles[RoleMeasuresAdmin.name] =
      RoleMeasuresAdmin.definition;
    this.plugin.imports.roles[RoleMeasuresReader.name] =
      RoleMeasuresReader.definition;
  }
}
