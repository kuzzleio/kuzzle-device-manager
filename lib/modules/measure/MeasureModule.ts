import { Module } from "../shared/Module";

import { MeasuresController } from "./MeasuresController";
import { MeasureService } from "./MeasureService";
import { RoleMeasuresAdmin } from "./roles/RoleMeasuresAdmin";
import { RoleMeasuresReader } from "./roles/RoleMeasuresReader";

export class MeasureModule extends Module {
  private measureService: MeasureService;
  private measureController: MeasuresController;

  public async init(): Promise<void> {
    this.measureService = new MeasureService(this.plugin);
    this.measureController = new MeasuresController(this.measureService);

    this.plugin.api["device-manager/measures"] =
      this.measureController.definition;

    this.plugin.roles.push(RoleMeasuresAdmin);
    this.plugin.roles.push(RoleMeasuresReader);
  }
}
