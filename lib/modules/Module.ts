import { HyvisionApplication } from "../HyvisionApplication";

export abstract class Module {
  protected app: HyvisionApplication;

  protected get sdk () {
    return this.app.sdk;
  }

  constructor (app: HyvisionApplication) {
    this.app = app;
  }

  abstract register (): void;

  abstract init (): Promise<void>;
}