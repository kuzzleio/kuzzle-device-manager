import {
  Backend,
  BatchController,
  JSONObject,
  KuzzleRequest,
  PluginContext,
} from "kuzzle";
import { v4 as uuidv4 } from "uuid";

import { DeviceManagerPlugin } from "../../DeviceManagerPlugin";
import { DeviceManagerConfiguration } from "../engine";

import { Decoder } from "./Decoder";
import { MeasureService } from "./MeasureService";

export class PayloadService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;
  private batch: BatchController;
  private measureService: MeasureService;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  private get app(): Backend {
    return global.app;
  }

  constructor(
    plugin: DeviceManagerPlugin,
    batchController: BatchController,
    measureService: MeasureService
  ) {
    this.config = plugin.config as any;
    this.context = plugin.context;
    this.measureService = measureService;

    this.batch = batchController;
  }

  /**
   * Process a payload by validating and decode it with the `decoder` associated
   * with the device model. It :
   * - register the brut `Payload`
   * - redirect measurements to MeasureService
   */
  async process(
    request: KuzzleRequest,
    decoder: Decoder,
    { refresh }: { refresh?: "wait_for" | "false" } = {}
  ) {
    const payload = request.getBody();

    const uuid = request.input.args.uuid || uuidv4();
    let valid = true;

    try {
      valid = await decoder.validate(payload, request);

      if (!valid) {
        return { valid };
      }
    } catch (error) {
      valid = false;
      throw error;
    } finally {
      await this.savePayload(decoder.deviceModel, uuid, valid, payload);
    }

    const decodedPayload = await decoder.decode(payload, request);

    return this.measureService.processDecodedPayload(
      decoder.deviceModel,
      decodedPayload,
      [uuid],
      { refresh }
    );
  }

  /**
   * Method used to save the payload and catch + log the error if any.
   *
   * This method never returns a rejected promise.
   */
  private async savePayload(
    deviceModel: string,
    uuid: string,
    valid: boolean,
    payload: JSONObject
  ) {
    try {
      await this.batch.create(
        this.config.adminIndex,
        "payloads",
        { deviceModel, payload, uuid, valid },
        uuid
      );
    } catch (error) {
      this.app.log.error(
        `Cannot save the payload from "${deviceModel}": ${error}`
      );
    }
  }
}
