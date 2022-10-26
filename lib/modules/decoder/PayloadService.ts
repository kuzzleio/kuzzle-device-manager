import { Backend, JSONObject, KuzzleRequest, PluginContext } from "kuzzle";
import { v4 as uuidv4 } from "uuid";

import {
  DeviceManagerPlugin,
  DeviceManagerConfiguration,
  InternalCollection,
} from "../../core";
import { Device, DeviceContent, DeviceSerializer } from "../device";
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

  constructor(plugin: DeviceManagerPlugin) {
    this.config = plugin.config as any;
    this.context = plugin.context;
  }

  /**
   * Process a payload by validating and decode it with the `decoder` associated
   * with the device model. It :
   * - register the brut `Payload`
   * - redirect measurements to MeasureService
   */
  async receive(
    request: KuzzleRequest,
    decoder: Decoder,
    { refresh }: any = {}
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

    const devices = await this.retrieveDevices(
      decoder.deviceModel,
      decodedPayload.references,
      { refresh }
    );

    for (const device of devices) {
      await this.app.trigger<EventMeasureIngest>(
        "device-manager:measures:ingest",
        {
          device,
          measurements: decodedPayload.getMeasurements(
            device._source.reference
          ),
          metadata: decodedPayload.getMetadata(device._source.reference),
          payloadUuids: [uuid],
        }
      );
    }

    return { valid };
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

  /**
   * Get devices or create missing ones (when auto-provisionning is enabled)
   */
  private async retrieveDevices(
    deviceModel: string,
    references: string[],
    {
      refresh,
    }: {
      refresh?: any;
    } = {}
  ) {
    const devices: Device[] = [];

    const { successes, errors } = await this.sdk.document.mGet<DeviceContent>(
      this.config.adminIndex,
      InternalCollection.DEVICES,
      references.map((reference) => DeviceSerializer.id(deviceModel, reference))
    );

    for (const { _source, _id } of successes) {
      devices.push(new Device(_source, _id));
    }

    // If we have unknown devices, let's check if we should register them
    if (errors.length > 0) {
      const { _source } = await this.sdk.document.get(
        this.config.adminIndex,
        this.config.adminCollections.config.name,
        "plugin--device-manager"
      );

      if (_source["device-manager"].provisioningStrategy === "auto") {
        const newDevices = await this.provisionDevices(deviceModel, errors, {
          refresh,
        });
        devices.push(...newDevices);
      } else {
        this.app.log.info(
          `Skipping new devices "${errors.join(
            ", "
          )}". Auto-provisioning is disabled.`
        );
      }
    }

    return devices;
  }

  private async provisionDevices(
    deviceModel: string,
    deviceIds: string[],
    { refresh }: { refresh: any }
  ): Promise<Device[]> {
    const newDevices = deviceIds.map((deviceId) => {
      // Reference may contains a "-"
      const [, ...rest] = deviceId.split("-");
      const reference = rest.join("-");

      return {
        _id: DeviceSerializer.id(deviceModel, reference),
        body: {
          measures: [],
          model: deviceModel,
          reference,
        },
      };
    });

    const { successes, errors } =
      await this.sdk.document.mCreate<DeviceContent>(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        newDevices,
        { refresh }
      );

    for (const error of errors) {
      this.app.log.error(
        `Cannot create device "${error.document._id}": ${error.reason}`
      );
    }

    return successes.map(({ _source, _id }) => new Device(_source as any, _id));
  }

  public async prune(
    days: number,
    onlyValid: boolean,
    { deviceModel }: { deviceModel?: string } = {}
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