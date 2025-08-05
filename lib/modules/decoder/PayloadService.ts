import { KuzzleRequest } from "kuzzle";
import { ask, onAsk } from "kuzzle-plugin-commons";
import { JSONObject, KDocument } from "kuzzle-sdk";
import { v4 as uuidv4 } from "uuid";

import { DeviceContent, DeviceSerializer } from "../device";
import { AskMeasureSourceIngest, DecodedMeasurement } from "../measure";
import { AskModelDeviceGet } from "../model";
import { DeviceManagerPlugin, InternalCollection } from "../plugin";
import { BaseService } from "../shared";

import { DecodedPayload } from "./DecodedPayload";
import { Decoder } from "./Decoder";
import { DecodingState } from "./DecodingState";
import { SkipError } from "./SkipError";
import { AskPayloadReceiveFormated } from "./types/PayloadEvents";

export class PayloadService extends BaseService {
  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);

    onAsk<AskPayloadReceiveFormated>(
      "ask:device-manager:payload:receive-formated",
      async (payload) => {
        await this.receiveFormated(payload.device, payload.measures, {
          payloadUuids: payload.payloadUuids,
        });
      },
    );
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
    { refresh }: any = {},
  ) {
    const payload = request.getBody();
    const apiAction = `${request.input.controller}:${request.input.action}`;

    const uuid = request.input.args.uuid || uuidv4();
    let valid = true;
    let state = DecodingState.VALID;
    let errorReason;

    try {
      valid = await decoder.validate(payload, request);

      // TODO: Temporary workaround to prevent breaking anything; in the future,
      // consider modifying the return value of the 'validate' function to return an object
      if (!valid) {
        throw new SkipError("Skip by user defined validation");
      }
    } catch (error) {
      valid = false;
      errorReason = error.message;
      if (error instanceof SkipError) {
        state = DecodingState.SKIP;
        return { valid };
      }
      state = DecodingState.ERROR;
      throw error;
    } finally {
      await this.savePayload(
        decoder.deviceModel,
        uuid,
        valid,
        payload,
        apiAction,
        DecodingState[state],
        errorReason,
      );
    }

    let decodedPayload = new DecodedPayload<any>(decoder);
    decodedPayload = await decoder.decode(decodedPayload, payload, request);
    if (decodedPayload.references.length === 0) {
      this.app.log.debug(
        `No change detected in measurements or metadata for device model "${decoder.deviceModel}", skipping ingestion`,
      );

      return { valid };
    }

    let ingestMeasurements = true;
    if (!decodedPayload.hasMeasurements()) {
      this.app.log.debug(
        `No change detected in measurements for device model "${decoder.deviceModel}", skipping measure ingestion`,
      );
      ingestMeasurements = false;
    }

    let changeMetadata = true;
    if (!decodedPayload.hasMetadata()) {
      this.app.log.debug(
        `No change detected in metadata for device model "${decoder.deviceModel}", skipping metadata ingestion`,
      );
      changeMetadata = false;
    }

    const devices = await this.retrieveDevices(
      decoder.deviceModel,
      decodedPayload.references,
      { refresh },
    );

    for (const device of devices) {
      const {
        _id,
        _source: { reference, model, metadata, assetId, engineId },
      } = device;
      // ? Done here to avoid invoque Measure service only for device metadata change (if no engineId)
      const deviceMetadataChanges = decodedPayload.getMetadata(reference);

      if (
        changeMetadata &&
        deviceMetadataChanges !== null &&
        Object.values(deviceMetadataChanges).length > 0
      ) {
        await this.sdk.document.update<DeviceContent>(
          this.config.adminIndex,
          InternalCollection.DEVICES,
          _id,
          {
            metadata: deviceMetadataChanges,
          },
        );
        if (engineId !== null) {
          await this.sdk.document.update<DeviceContent>(
            engineId,
            InternalCollection.DEVICES,
            _id,
            {
              metadata: deviceMetadataChanges,
            },
          );
        }
      }

      if (engineId !== null && ingestMeasurements) {
        await ask<AskMeasureSourceIngest>(
          "device-manager:measures:sourceIngest",
          {
            measurements: decodedPayload.getMeasurements(reference),
            payloadUuids: [uuid],
            source: {
              deviceMetadata: metadata,
              id: _id,
              metadata: decodedPayload.getMetadata(reference),
              model: model,
              reference: reference,
              type: "device",
            },
            target: {
              assetId: assetId ?? null,
              indexId: engineId,
              type: "device",
            },
          },
        );
      }
    }

    return { valid };
  }

  async receiveFormated(
    device: KDocument<DeviceContent>,
    measurements: DecodedMeasurement[],
    { payloadUuids }: { payloadUuids?: string[] } = {},
  ) {
    const apiAction = "device-manager/devices:receiveMeasure";
    const {
      _id,
      _source: { reference, model, metadata, assetId, engineId },
    } = device;

    // TODO: do we want update a metadata from formatted payload to ?
    // Payload is already formated thus valid
    await this.savePayload(
      model,
      payloadUuids[0],
      true,
      measurements,
      apiAction,
    );

    if (engineId !== null) {
      await ask<AskMeasureSourceIngest>(
        "device-manager:measures:sourceIngest",
        {
          measurements,
          payloadUuids,
          source: {
            deviceMetadata: metadata,
            id: _id,
            model: model,
            reference: reference,
            type: "device",
          },
          target: {
            assetId: assetId ?? null,
            indexId: engineId,
            type: "device",
          },
        },
      );
    }
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
    payload: JSONObject,
    apiAction: string,
    state?: string,
    reason?: string,
  ) {
    try {
      await this.sdk.document.create(
        this.config.adminIndex,
        "payloads",
        { apiAction, deviceModel, payload, reason, state, uuid, valid },
        uuid,
      );
    } catch (error) {
      this.app.log.error(
        `Cannot save the payload from "${deviceModel}": ${error}`,
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
    } = {},
  ) {
    const { successes: devices, errors } =
      await this.sdk.document.mGet<DeviceContent>(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        references.map((reference) =>
          DeviceSerializer.id(deviceModel, reference),
        ),
      );

    // Due to the existence of a "devices" collection in the tenant index and a platform index,
    // we need to fetch the device content from the associated tenant if it exists.
    const updatedDevices = await Promise.all(
      devices.map((device) =>
        device._source.engineId && device._source.engineId.trim() !== ""
          ? this.sdk.document.get<DeviceContent>(
              device._source.engineId,
              InternalCollection.DEVICES,
              device._id,
            )
          : device,
      ),
    );

    // If we have unknown devices, let's check if we should register them
    if (errors.length > 0) {
      const { _source } = await this.sdk.document.get(
        this.config.adminIndex,
        this.config.adminCollections.config.name,
        "plugin--device-manager",
      );

      if (_source["device-manager"].provisioningStrategy === "auto") {
        const newDevices = await this.provisionDevices(deviceModel, errors, {
          refresh,
        });
        updatedDevices.push(...newDevices);
      } else {
        this.app.log.info(
          `Skipping new devices "${errors.join(
            ", ",
          )}". Auto-provisioning is disabled.`,
        );
      }
    }

    return updatedDevices;
  }

  private async provisionDevices(
    deviceModel: string,
    deviceIds: string[],
    { refresh }: { refresh: any },
  ): Promise<KDocument<DeviceContent>[]> {
    const deviceModelContent = await ask<AskModelDeviceGet>(
      "ask:device-manager:model:device:get",
      {
        model: deviceModel,
      },
    );

    const newDevices = deviceIds.map((deviceId) => {
      // Reference may contains a "-"
      const [, ...rest] = deviceId.split("-");
      const reference = rest.join("-");

      const body: DeviceContent = {
        assetId: null,
        engineId: null,
        groups: [],
        lastMeasuredAt: 0,
        measureSlots: deviceModelContent.device.measures,
        metadata: {},
        model: deviceModel,
        reference,
      };

      return {
        _id: DeviceSerializer.id(deviceModel, reference),
        body,
      };
    });

    const { successes, errors } =
      await this.sdk.document.mCreate<DeviceContent>(
        this.config.adminIndex,
        InternalCollection.DEVICES,
        newDevices,
        { refresh },
      );

    for (const error of errors) {
      this.app.log.error(
        `Cannot create device "${error.document._id}": ${error.reason}`,
      );
    }

    return successes as KDocument<DeviceContent>[];
  }

  public async prune(
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

    const deleted = await this.sdk.bulk.deleteByQuery(
      this.config.adminIndex,
      "payloads",
      { query: { bool: { filter } } },
    );

    return deleted;
  }

  public async receiveUnknown(
    deviceModel: string,
    payload: JSONObject,
    apiAction: string,
  ) {
    await this.savePayload(deviceModel, uuidv4(), false, payload, apiAction);
  }
}
