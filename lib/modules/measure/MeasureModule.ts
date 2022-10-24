import { Module } from "../shared/Module";

import { MeasureController } from "./MeasureController";
import { MeasureService } from "./MeasureService";

export class MeasureModule extends Module {
  private measureService: MeasureService;
  private measureController: MeasureController;

  // @todo temporary until register refactor
  protected get measuresRegister() {
    // eslint-disable-next-line dot-notation
    return this.plugin["measuresRegister"];
  }

  public async init(): Promise<void> {
    this.measureService = new MeasureService(
      this.plugin,
      this.measuresRegister
    );
    this.measureController = new MeasureController(this.measureService);

    this.plugin.api["device-manager/measures"] =
      this.measureController.definition;
  }
}
