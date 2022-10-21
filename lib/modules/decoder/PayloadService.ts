import {
  Backend,
  JSONObject,
  KuzzleRequest,
  PluginContext,
} from "kuzzle";
import { v4 as uuidv4 } from "uuid";

import { DeviceManagerPlugin, DeviceManagerConfiguration } from "../../core";
import { EventMeasureIngest } from "../measure";

import { Decoder } from "./Decoder";

export class PayloadService {
  private config: DeviceManagerConfiguration;
  private context: PluginContext;

  private get sdk() {
    return this.context.accessors.sdk;
  }

  private get app(): Backend {
    return global.app;
  }

  constructor(
    plugin: DeviceManagerPlugin,
  ) {
    this.config = plugin.config as any;
    this.context = plugin.context;
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

    await this.app.trigger<EventMeasureIngest>(
      "device-manager:measure:ingest",
      {
        deviceModel: decoder.deviceModel,
        decodedPayload,
        payloadUuids: [uuid],
        options: { refresh },
      })
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
      await this.sdk.document.create(
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

  public async prune (
    days: number,
    onlyValid: boolean,
    { deviceModel }: { deviceModel?: string } = {},
  ): Promise<number> {
    const filter = [];

    const date = new Date().setDate(new Date().getDate() - days);
    filter.push({
      range: {
        "_kuzzle_info.createdAt": {
          lt: date,
        },
      },
    });

    if (onlyValid === true) {
      filter.push({ term: { valid: true } });
    }

    if (deviceModel) {
      filter.push({ term: { deviceModel } });
    }

    const deleted = await this.context.accessors.sdk.bulk.deleteByQuery(
      this.config.adminIndex,
      "payloads",
      { query: { bool: { filter } } }
    );

    return deleted;
  }
}
