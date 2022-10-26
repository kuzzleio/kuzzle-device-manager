import { Module } from "../shared/Module";

import { MeasuresController } from "./MeasuresController";
import { MeasureService } from "./MeasureService";

export class MeasureModule extends Module {
  private measureService: MeasureService;
  private measureController: MeasuresController;

  // @todo temporary until register refactor
  protected get measuresRegister() {
    // eslint-disable-next-line dot-notation
    return this.plugin["measuresRegister"];
  }

  public async init(): Promise<void> {
    this.measureService = new MeasureService(this.plugin);
    this.measureController = new MeasuresController(this.measureService);

    this.plugin.api["device-manager/measures"] =
      this.measureController.definition;
  }
}