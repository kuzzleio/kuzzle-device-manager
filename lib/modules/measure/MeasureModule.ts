import { Module } from "../shared/Module";

import { MeasureService } from "./MeasureService";
import { RoleMeasuresAdmin } from "./roles/RoleMeasuresAdmin";
import { RoleMeasuresReader } from "./roles/RoleMeasuresReader";

export class MeasureModule extends Module {
  private measureService: MeasureService;

  public async init(): Promise<void> {
    this.measureService = new MeasureService(this.plugin);

    this.plugin.roles.push(RoleMeasuresAdmin);
    this.plugin.roles.push(RoleMeasuresReader);
  }
}
