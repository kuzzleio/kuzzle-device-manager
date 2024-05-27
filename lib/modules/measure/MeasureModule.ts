import { Module } from "../shared/Module";
import { MeasureController } from "./MeasureController";

import { MeasureService } from "./MeasureService";
import { RoleMeasuresAdmin } from "./roles/RoleMeasuresAdmin";
import { RoleMeasuresReader } from "./roles/RoleMeasuresReader";

export class MeasureModule extends Module {
  private measureService: MeasureService;
  private measureController: MeasureController;

  public async init(): Promise<void> {
    this.measureService = new MeasureService(this.plugin);
    this.measureController = new MeasureController(this.measureService);

    this.plugin.api["device-manager/measures"] =
      this.measureController.definition;
    this.plugin.imports.roles[RoleMeasuresAdmin.name] =
      RoleMeasuresAdmin.definition;
    this.plugin.imports.roles[RoleMeasuresReader.name] =
      RoleMeasuresReader.definition;
  }
}
