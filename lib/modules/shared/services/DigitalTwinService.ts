import { BadRequestError, KuzzleRequest, NotFoundError } from "kuzzle";
import { ask, onAsk } from "kuzzle-plugin-commons";
import { JSONObject, KDocument, KHit } from "kuzzle-sdk";

import { MeasureContent } from "../../measure";
import { DeviceManagerPlugin, InternalCollection } from "../../plugin";
import { ApiDigitalTwinMGetLastMeasuredAtResult } from "../types/DigitalTwinApi";
import {
  AskDigitalTwinLastMeasuresGet,
  AskDigitalTwinLink,
  AskDigitalTwinUnlink,
} from "../types/DigitalTwinEvents";

import { BaseService } from "./BaseService";
import {
  AskAssetHistoryAdd,
  AssetContent,
  AssetHistoryEventLink,
  AssetHistoryEventUnlink,
} from "lib/modules/asset";
import { DeviceContent, DeviceProvisioningContent } from "lib/modules/device";
import {
  AskModelAssetGet,
  AskModelDeviceGet,
  AssetModelContent,
  DeviceModelContent,
} from "lib/modules/model";
import { lock } from "../utils";

type MGetLastMeasuresAggregation = {
  byDigitalTwin: {
    buckets: Array<{
      key: string;
      doc_count: number;
      byMeasureName: {
        buckets: Array<{
          key: string;
          doc_count: number;
          lastMeasure: {
            hits: {
              hits: KHit<MeasureContent>[];
            };
          };
        }>;
      };
    }>;
  };
};

type MGetLastMeasuredAtAggregation = {
  byDigitalTwin: {
    buckets: Array<{
      key: string;
      doc_count: number;
      lastMeasuredAt: {
        value: number;
        value_as_string: number;
      };
    }>;
  };
};

type DigitalTwinAggregationQueryParameters = {
  measureNameField: string;
  idField: string;
  query: JSONObject;
};
type MeasureSlot = { asset: string; device: string };

export class DigitalTwinService extends BaseService {
  private readonly digitalTwinType: "asset" | "device";

  constructor(
    plugin: DeviceManagerPlugin,
    private targetCollection: InternalCollection,
  ) {
    super(plugin);

    this.digitalTwinType =
      this.targetCollection === InternalCollection.ASSETS ? "asset" : "device";

    this.registerAskEvents();
  }

  protected registerAskEvents() {
    onAsk<AskDigitalTwinLastMeasuresGet>(
      `ask:device-manager:${this.digitalTwinType}:get-last-measures`,
      (payload) => {
        return this.getLastMeasures(payload.engineId, payload.digitalTwinId);
      },
    );

    onAsk<AskDigitalTwinLink>(
      this.digitalTwinType === "asset"
        ? `ask:device-manager:asset:link-device`
        : `ask:device-manager:device:link-asset`,
      async ({ deviceId, engineId, user, assetId, measureSlots }) => {
        const request = new KuzzleRequest({ refresh: "false" }, { user });
        await this.linkAssetDevice(
          engineId,
          deviceId,
          assetId,
          measureSlots,
          false,
          request,
        );
      },
    );
    onAsk<AskDigitalTwinUnlink>(
      this.digitalTwinType === "asset"
        ? `ask:device-manager:asset:unlink-device`
        : `ask:device-manager:device:unlink-asset`,
      async ({ deviceId, assetId, user, allMeasures, measureSlots }) => {
        const request = new KuzzleRequest({ refresh: "false" }, { user });
        await this.unlinkAssetDevice(
          deviceId,
          assetId,
          measureSlots,
          allMeasures,
          request,
        );
      },
    );
  }

  /**
   * Gets the last measures of a digital twin
   */
  public async getLastMeasures(
    engineId: string,
    digitalTwinId: string,
    measureCount = 100,
  ): Promise<MeasureContent[]> {
    const measures = await this.mGetLastMeasures(
      engineId,
      [digitalTwinId],
      measureCount,
    );

    if (!(digitalTwinId in measures)) {
      throw new NotFoundError(
        "No measure could be found for this digital twin",
      );
    }

    return measures[digitalTwinId];
  }

  /**
   * Link a device to an asset.
   */
  async linkAssetDevice(
    engineId: string,
    deviceId: string,
    assetId: string,
    measureSlots: { asset: string; device: string }[],
    implicitMeasuresLinking: boolean,
    request: KuzzleRequest,
  ): Promise<{
    asset: KDocument<AssetContent>;
    device: KDocument<DeviceContent>;
  }> {
    return lock(`device:${deviceId}`, async () => {
      const deviceProvisioning = await this.getDeviceProvisioning(deviceId);
      const engine = await this.getEngine(engineId);

      this.checkDeviceAttachedToEngine(deviceProvisioning);
      if (deviceProvisioning._source.engineId !== engineId) {
        throw new BadRequestError(
          `Device "${deviceProvisioning._id}" is not attached to the specified engine.`,
        );
      }
      const device = await this.sdk.document.get<DeviceContent>(
        engineId,
        InternalCollection.DEVICES,
        deviceId,
      );

      const asset = await this.sdk.document.get<AssetContent>(
        engineId,
        InternalCollection.ASSETS,
        assetId,
      );

      const [assetModel, deviceModel] = await Promise.all([
        this.getAssetModel(engine.group, asset._source.model),
        this.getDeviceModel(deviceProvisioning._source.model),
      ]);

      const updatedMeasureSlots: MeasureSlot[] = [];
      for (const measure of measureSlots) {
        const foundMeasure = deviceModel.device.measures.find(
          (deviceMeasure) => deviceMeasure.name === measure.device,
        );
        if (!foundMeasure && !implicitMeasuresLinking) {
          throw new BadRequestError(
            `Measure "${measure.asset}" is not declared in the device model "${measure.device}".`,
          );
        }
        updatedMeasureSlots.push({
          asset: measure.asset,
          device: measure.device,
        });
      }

      this.checkAssetAlreadyProvidedMeasures(
        asset,
        deviceId,
        updatedMeasureSlots,
      );
      this.checkDeviceAlreadyProvidingMeasures(
        device,
        assetId,
        updatedMeasureSlots,
      );

      if (implicitMeasuresLinking) {
        this.addAvailableLinkableMeasures(
          asset,
          device,
          assetModel,
          deviceModel,
          updatedMeasureSlots,
        );
      }
      if (updatedMeasureSlots.length === 0) {
        if (
          !device._source.linkedMeasures.find(
            (link) => link.assetId === asset._id,
          )
        ) {
          throw new BadRequestError(
            `No measure can be linked from"${deviceId}" to asset "${assetId}".`,
          );
        }
      }
      const previousDeviceLink = device._source.linkedMeasures.find(
        (link) => link.assetId === asset._id,
      );
      if (previousDeviceLink) {
        previousDeviceLink.measureSlots = [
          ...updatedMeasureSlots,
          ...previousDeviceLink.measureSlots.filter(
            (measure) =>
              !updatedMeasureSlots.some((m) => m.device === measure.device),
          ),
        ];
      } else {
        device._source.linkedMeasures.push({
          assetId: asset._id,
          measureSlots: updatedMeasureSlots,
        });
      }
      const previousAssetLink = asset._source.linkedMeasures.find(
        (link) => link.deviceId === device._id,
      );
      if (previousAssetLink) {
        previousAssetLink.measureSlots = [
          ...updatedMeasureSlots,
          ...previousAssetLink.measureSlots.filter(
            (measure) =>
              !updatedMeasureSlots.some((m) => m.asset === measure.asset),
          ),
        ];
      } else {
        asset._source.linkedMeasures.push({
          deviceId,
          measureSlots: updatedMeasureSlots,
        });
      }

      const [updatedDevice, updatedAsset] = await Promise.all([
        this.updateDocument<DeviceContent>(request, device, {
          collection: InternalCollection.DEVICES,
          engineId: deviceProvisioning._source.engineId,
        }),

        lock(`asset:${engineId}:${asset._id}`, async () =>
          this.updateDocument<AssetContent>(
            request,
            asset,
            {
              collection: InternalCollection.ASSETS,
              engineId: deviceProvisioning._source.engineId,
            },
            { source: true },
          ),
        ),
      ]);

      const event: AssetHistoryEventLink = {
        link: {
          deviceId: deviceProvisioning._id,
        },
        name: "link",
      };
      await ask<AskAssetHistoryAdd<AssetHistoryEventLink>>(
        "ask:device-manager:asset:history:add",
        {
          engineId,
          histories: [
            {
              asset: updatedAsset._source,
              event,
              id: updatedAsset._id,
              timestamp: Date.now(),
            },
          ],
        },
      );

      if (request.getRefresh() === "wait_for") {
        await Promise.all([
          this.sdk.collection.refresh(
            this.config.platformIndex,
            InternalCollection.DEVICES,
          ),
          this.sdk.collection.refresh(
            deviceProvisioning._source.engineId,
            InternalCollection.DEVICES,
          ),
          this.sdk.collection.refresh(
            deviceProvisioning._source.engineId,
            InternalCollection.ASSETS,
          ),
        ]);
      }
      return { asset: updatedAsset, device: updatedDevice };
    });
  }
  /**
   * Unlink a device of an asset with lock
   *
   * @param {string} deviceId Id of the device
   * @param {string} assetId Id of the asset
   * @param {KuzzleRequest} request kuzzle request
   */
  async unlinkAssetDevice(
    deviceId: string,
    assetId: string,
    measureSlots: MeasureSlot[],
    allMeasures: undefined | boolean,
    request: KuzzleRequest,
  ): Promise<{
    asset: KDocument<AssetContent>;
    device: KDocument<DeviceContent>;
  }> {
    return lock(`device:${deviceId}`, async () =>
      this._unlinkAssetDevice(
        deviceId,
        assetId,
        measureSlots,
        allMeasures,
        request,
      ),
    );
  }
  /**
   * Gets the last measures of multiple digital twins
   */
  public async mGetLastMeasures(
    engineId: string,
    digitalTwinIds: string[],
    measureCount = 100,
  ): Promise<Record<string, MeasureContent[]>> {
    if (digitalTwinIds.length === 0) {
      return {};
    }

    const aggregationParameters =
      this.getAggregationQueryParameters(digitalTwinIds);

    const result = await this.sdk.document.search(
      engineId,
      InternalCollection.MEASURES,
      {
        aggregations: {
          byDigitalTwin: {
            aggregations: {
              byMeasureName: {
                aggregations: {
                  lastMeasure: {
                    top_hits: {
                      size: 1,
                      sort: { measuredAt: "desc" },
                    },
                  },
                },
                terms: {
                  field: aggregationParameters.measureNameField,
                  size: measureCount,
                },
              },
            },
            terms: {
              field: aggregationParameters.idField,
              size: digitalTwinIds.length,
            },
          },
        },
        query: aggregationParameters.query,
      },
      {
        size: 0,
      },
    );

    const aggregations = result.aggregations as MGetLastMeasuresAggregation;
    return aggregations.byDigitalTwin.buckets.reduce<
      Record<string, MeasureContent[]>
    >((digitalTwinAccumulator, digitalTwinBucket) => {
      const measureContents = digitalTwinBucket.byMeasureName.buckets.reduce<
        MeasureContent[]
      >((measureAccumulator, measureBucket) => {
        return [
          ...measureAccumulator,
          ...measureBucket.lastMeasure.hits.hits.map((hit) => hit._source),
        ];
      }, []);

      return {
        ...digitalTwinAccumulator,
        [digitalTwinBucket.key]: measureContents,
      };
    }, {});
  }

  public async getLastMeasuredAt(
    engineId: string,
    digitalTwinId: string,
  ): Promise<number> {
    const aggregationParameters = this.getAggregationQueryParameters([
      digitalTwinId,
    ]);

    const result = await this.sdk.document.search<
      Pick<MeasureContent, "measuredAt">
    >(
      engineId,
      InternalCollection.MEASURES,
      {
        _source: "measuredAt",
        query: aggregationParameters.query,
        sort: {
          measuredAt: "desc",
        },
      },
      {
        size: 1,
      },
    );

    if (result.hits.length < 1) {
      throw new NotFoundError(
        "No measure could be found for this digital twin",
      );
    }

    return result.hits[0]._source.measuredAt;
  }

  public async mGetLastMeasuredAt(
    engineId: string,
    digitalTwinIds: string[],
  ): Promise<ApiDigitalTwinMGetLastMeasuredAtResult> {
    if (digitalTwinIds.length === 0) {
      return {};
    }

    const aggregationParameters =
      this.getAggregationQueryParameters(digitalTwinIds);

    const result = await this.sdk.document.search(
      engineId,
      InternalCollection.MEASURES,
      {
        aggregations: {
          byDigitalTwin: {
            aggregations: {
              lastMeasuredAt: {
                max: {
                  field: "measuredAt",
                },
              },
            },
            terms: {
              field: aggregationParameters.idField,
              size: digitalTwinIds.length,
            },
          },
        },
        query: aggregationParameters.query,
      },
      {
        size: 0,
      },
    );

    const aggregations = result.aggregations as MGetLastMeasuredAtAggregation;
    return aggregations.byDigitalTwin.buckets.reduce<ApiDigitalTwinMGetLastMeasuredAtResult>(
      (accumulator, bucket) => {
        return {
          ...accumulator,
          [bucket.key]: bucket.lastMeasuredAt.value,
        };
      },
      {},
    );
  }

  private getAggregationQueryParameters(
    digitalTwinId: string[],
  ): DigitalTwinAggregationQueryParameters {
    switch (this.digitalTwinType) {
      case "asset":
        return {
          idField: "asset._id",
          measureNameField: "asset.measureName",
          query: {
            terms: {
              "asset._id": digitalTwinId,
            },
          },
        };

      case "device":
        return {
          idField: "origin._id",
          measureNameField: "origin.measureName",
          query: {
            bool: {
              must: [
                { terms: { "origin._id": digitalTwinId } },
                { term: { "origin.type": "device" } },
              ],
            },
          },
        };
    }
  }
  /**
   * Checks if the asset does not already have a linked device using one of the
   * requested measure slots.
   */
  protected checkAssetAlreadyProvidedMeasures(
    asset: KDocument<AssetContent>,
    deviceId: string,
    requestedMeasureNames: MeasureSlot[],
  ) {
    const measureAlreadyProvided = (assetMeasureName: string): boolean => {
      return asset._source.linkedMeasures.some((link) =>
        link.measureSlots.some(
          (names) =>
            names.asset === assetMeasureName && link.deviceId !== deviceId,
        ),
      );
    };

    for (const name of requestedMeasureNames) {
      if (measureAlreadyProvided(name.asset)) {
        throw new BadRequestError(
          `Measure name "${name.asset}" is already provided by another device on this asset.`,
        );
      }
    }
  }
  /**
   * Checks if the device does not already have a linked asset using one of the
   * requested measure slots.
   */
  protected checkDeviceAlreadyProvidingMeasures(
    device: KDocument<DeviceContent>,
    assetId: string,
    requestedMeasureNames: MeasureSlot[],
  ) {
    const measureAlreadyProvided = (deviceMeasureName: string): boolean => {
      return device._source.linkedMeasures.some((link) =>
        link.measureSlots.some(
          (names) =>
            names.device === deviceMeasureName && link.assetId !== assetId,
        ),
      );
    };

    for (const name of requestedMeasureNames) {
      if (measureAlreadyProvided(name.asset)) {
        throw new BadRequestError(
          `Measure name "${name.device}" is already provided to another asset by this device.`,
        );
      }
    }
  }
  /**
   * Goes through the device available measures and add them into the link if:
   *  - they are not already provided to the asset by another device
   *  - they are not already provided to another asset by the device
   *  - they are not already present in the link request
   *  - they are declared in the asset model
   */
  protected addAvailableLinkableMeasures(
    asset: KDocument<AssetContent>,
    device: KDocument<DeviceContent>,
    assetModel: AssetModelContent,
    deviceModel: DeviceModelContent,
    requestedMeasureSlots: MeasureSlot[],
  ) {
    const measureProvidedByOtherDevice = (
      assetMeasureName: string,
    ): boolean => {
      return asset._source.linkedMeasures.some((link) =>
        link.measureSlots.some((slot) => slot.asset === assetMeasureName),
      );
    };

    const measureRequestedByOtherLink = (
      deviceMeasureName: string,
    ): boolean => {
      return requestedMeasureSlots.some(
        (slot) => slot.device === deviceMeasureName,
      );
    };

    const noTypeInCommon = (deviceMeasureType: string): boolean => {
      return !assetModel.asset.measures.some(
        (measure) => measure.type === deviceMeasureType,
      );
    };
    const measureSlotTaken = (deviceMeasureName: string): boolean => {
      return device._source.linkedMeasures.some((link) =>
        link.measureSlots.map((m) => m.device).includes(deviceMeasureName),
      );
    };
    for (const deviceMeasure of deviceModel.device.measures) {
      if (
        measureSlotTaken(deviceMeasure.name) ||
        measureRequestedByOtherLink(deviceMeasure.name) ||
        noTypeInCommon(deviceMeasure.type)
      ) {
        continue;
      }
      const availableMeasures = assetModel.asset.measures.filter((measure) => {
        // Check measures of same type
        if (measure.type !== deviceMeasure.type) {
          return false;
        }
        // Check measures are not provided by another device
        if (measureProvidedByOtherDevice(measure.name)) {
          return false;
        }
        return true;
      });
      const assetMeasure = availableMeasures[0];
      // If one assetMeasure exists, request a link
      if (assetMeasure) {
        requestedMeasureSlots.push({
          asset: assetMeasure.name,
          device: deviceMeasure.name,
        });
      }
    }
  }
  /**
   * Internal logic of unlink a device of an asset
   *
   * @param {string} deviceId Id of the device
   * @param {KuzzleRequest} request kuzzle request
   */
  protected async _unlinkAssetDevice(
    deviceId: string,
    assetId: string,
    measureSlots: MeasureSlot[],
    allMeasures: undefined | boolean,
    request: KuzzleRequest,
  ): Promise<{
    asset: KDocument<AssetContent>;
    device: KDocument<DeviceContent>;
  }> {
    const deviceProvisioning = await this.getDeviceProvisioning(deviceId);
    const engineId = deviceProvisioning._source.engineId;

    this.checkDeviceAttachedToEngine(deviceProvisioning);
    const device = await this.sdk.document.get<DeviceContent>(
      engineId,
      InternalCollection.DEVICES,
      deviceId,
    );
    if (
      !device._source.linkedMeasures
        .map((measure) => measure.assetId)
        .includes(assetId)
    ) {
      throw new BadRequestError(
        `Device "${deviceProvisioning._id}" is not linked to an asset.`,
      );
    }

    const asset = await this.sdk.document.get<AssetContent>(
      engineId,
      InternalCollection.ASSETS,
      assetId,
    );
    let linkedMeasuresAssets = asset._source.linkedMeasures;
    let linkedMeasuresDevices = device._source.linkedMeasures;

    if (allMeasures) {
      linkedMeasuresAssets = asset._source.linkedMeasures.filter(
        (link) => link.deviceId !== device._id,
      );
      linkedMeasuresDevices = device._source.linkedMeasures.filter(
        (link) => link.assetId !== asset._id,
      );
    } else {
      linkedMeasuresAssets = asset._source.linkedMeasures
        .map((link) => {
          if (link.deviceId !== device._id) {
            return link;
          }
          return {
            ...link,
            measureSlots: link.measureSlots.filter(
              (measure) => !measureSlots.some((m) => m.asset === measure.asset),
            ),
          };
        })
        .filter((link) => link.measureSlots.length > 0);
      linkedMeasuresDevices = device._source.linkedMeasures
        .map((link) => {
          if (link.assetId !== asset._id) {
            return link;
          }
          return {
            ...link,
            measureSlots: link.measureSlots.filter(
              (measure) =>
                !measureSlots.some((m) => m.device === measure.device),
            ),
          };
        })
        .filter((link) => link.measureSlots.length > 0);
    }

    const [updatedDevice, updatedAsset] = await Promise.all([
      this.updateDocument<DeviceContent>(
        request,
        { _id: deviceId, _source: { linkedMeasures: linkedMeasuresDevices } },
        {
          collection: InternalCollection.DEVICES,
          engineId,
        },
        { source: true },
      ),

      lock(`asset:${engineId}:${asset._id}`, async () =>
        this.updateDocument<AssetContent>(
          request,
          { _id: asset._id, _source: { linkedMeasures: linkedMeasuresAssets } },
          {
            collection: InternalCollection.ASSETS,
            engineId,
          },
          { source: true },
        ),
      ),
    ]);

    const event: AssetHistoryEventUnlink = {
      name: "unlink",
      unlink: {
        deviceId,
      },
    };
    await ask<AskAssetHistoryAdd<AssetHistoryEventUnlink>>(
      "ask:device-manager:asset:history:add",
      {
        engineId,
        histories: [
          {
            asset: updatedAsset._source,
            event,
            id: updatedAsset._id,
            timestamp: Date.now(),
          },
        ],
      },
    );

    if (request.getRefresh() === "wait_for") {
      await Promise.all([
        this.sdk.collection.refresh(
          this.config.platformIndex,
          InternalCollection.DEVICES,
        ),
        this.sdk.collection.refresh(engineId, InternalCollection.DEVICES),
        this.sdk.collection.refresh(engineId, InternalCollection.ASSETS),
      ]);
    }

    return { asset: updatedAsset, device: updatedDevice };
  }
  /**
   * Retrieve the model document of an asset
   * @param {any} engineGroup:string
   * @param {any} model:string
   * @returns {any}
   */
  protected getAssetModel(
    engineGroup: string,
    model: string,
  ): Promise<AssetModelContent> {
    return ask<AskModelAssetGet>("ask:device-manager:model:asset:get", {
      engineGroup,
      model,
    });
  }
  protected getDeviceModel(model: string): Promise<DeviceModelContent> {
    return ask<AskModelDeviceGet>("ask:device-manager:model:device:get", {
      model,
    });
  }
  protected async getEngine(engineId: string): Promise<JSONObject> {
    const engine = await this.sdk.document.get(
      this.config.platformIndex,
      InternalCollection.CONFIG,
      `engine-device-manager--${engineId}`,
    );

    return engine._source.engine;
  }
  protected async getDeviceProvisioning(deviceId: string) {
    return this.sdk.document.get<DeviceProvisioningContent>(
      this.config.platformIndex,
      InternalCollection.DEVICES,
      deviceId,
    );
  }
  protected checkDeviceAttachedToEngine(
    device: KDocument<DeviceProvisioningContent>,
  ) {
    if (!device._source.engineId) {
      throw new BadRequestError(
        `Device "${device._id}" is not attached to an engine.`,
      );
    }
  }
}
