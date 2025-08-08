/* eslint-disable @typescript-eslint/no-unused-vars */
import { Container, Warehouse } from "../application/assets";

import { groupFixtures } from "./groups";
import { ayseAssets } from "./assets";
import { ayseDevices, internalDevices } from "./devices";
import { dummyTempDeviceMeasures } from "../application/decoders/DummyTempDecoder";
import { dummyTempPositionDeviceMeasures } from "../application/decoders/DummyTempPositionDecoder";

const deviceDetached1 = {
  model: "DummyTemp",
  reference: "detached1",
  measureSlots: dummyTempDeviceMeasures,
  metadata: {},
};
const deviceDetached1Id = `${deviceDetached1.model}-${deviceDetached1.reference}`;

const deviceAyseLinked1 = {
  model: "DummyTemp",
  reference: "linked1",
  measureSlots: dummyTempDeviceMeasures,
  metadata: {},
  engineId: "engine-ayse",
  assetId: "Container-linked1",
};
const deviceAyseLinked1Id = `${deviceAyseLinked1.model}-${deviceAyseLinked1.reference}`;

const deviceAyseLinked2 = {
  model: "DummyTempPosition",
  reference: "linked2",
  measureSlots: dummyTempPositionDeviceMeasures,
  metadata: {},
  engineId: "engine-ayse",
  assetId: "Container-linked2",
};
const deviceAyseLinked2Id = `${deviceAyseLinked2.model}-${deviceAyseLinked2.reference}`;

const deviceAyseUnlinked1 = {
  model: "DummyTemp",
  reference: "unlinked1",
  measureSlots: dummyTempDeviceMeasures,
  metadata: {},
  engineId: "engine-ayse",
  assetId: null,
};
const deviceAyseUnlinked1Id = `${deviceAyseUnlinked1.model}-${deviceAyseUnlinked1.reference}`;

const deviceAyseUnlinked2 = {
  model: "DummyTemp",
  reference: "unlinked2",
  measureSlots: dummyTempDeviceMeasures,
  metadata: {},
  engineId: "engine-ayse",
  assetId: null,
};
const deviceAyseUnlinked2Id = `${deviceAyseUnlinked2.model}-${deviceAyseUnlinked2.reference}`;

const deviceAyseUnlinked3 = {
  model: "DummyTempPosition",
  reference: "unlinked3",
  measureSlots: dummyTempPositionDeviceMeasures,
  metadata: {},
  engineId: "engine-ayse",
  assetId: null,
};
const deviceAyseUnlinked3Id = `${deviceAyseUnlinked3.model}-${deviceAyseUnlinked3.reference}`;

const deviceAyseWarehouse = {
  model: "DummyTempPosition",
  reference: "warehouse",
  measureSlots: dummyTempPositionDeviceMeasures,
  metadata: {},
  engineId: "engine-ayse",
  assetId: "Warehouse-linked",
};
const deviceAyseWarehouseId = `${deviceAyseWarehouse.model}-${deviceAyseWarehouse.reference}`;

const assetAyseWarehouseLinked = {
  model: "Warehouse",
  reference: "linked",
  measureSlots: Warehouse.definition.measures,
  metadata: {
    surface: 512,
  },
  linkedDevices: [
    {
      measureNames: [{ asset: "position", device: "position" }],
      _id: "DummyTempPosition-warehouse",
    },
  ],
};
const assetAyseWarehouseLinkedId = `${assetAyseWarehouseLinked.model}-${assetAyseWarehouseLinked.reference}`;

const assetAyseLinked1 = {
  model: "Container",
  reference: "linked1",
  measureSlots: Container.definition.measures,
  metadata: {
    weight: 10,
    height: 11,
    trailer: {
      weight: 128,
      capacity: 1024,
    },
  },
  linkedDevices: [
    {
      measureNames: [{ asset: "temperatureExt", device: "temperature" }],
      _id: "DummyTemp-linked1",
    },
  ],
};
const assetAyseLinked1Id = `${assetAyseLinked1.model}-${assetAyseLinked1.reference}`;

const assetAyseLinked2 = {
  model: "Container",
  reference: "linked2",
  measureSlots: Container.definition.measures,
  metadata: {
    weight: 42,
    height: 21,
  },
  linkedDevices: [
    {
      measureNames: [
        { asset: "temperatureExt", device: "temperature" },
        { asset: "position", device: "position" },
      ],
      _id: "DummyTempPosition-linked2",
    },
  ],
};
const assetAyseLinked2Id = `${assetAyseLinked2.model}-${assetAyseLinked2.reference}`;

const assetAyseUnlinked = {
  model: "Container",
  reference: "unlinked1",
  measureSlots: Container.definition.measures,
  metadata: {
    weight: 20,
    height: 22,
  },
  linkedDevices: [],
};
const assetAyseUnlinkedId = `${assetAyseUnlinked.model}-${assetAyseUnlinked.reference}`;

const assetAyseGrouped = {
  model: "Container",
  reference: "grouped",
  measureSlots: Container.definition.measures,
  metadata: {
    weight: 20,
    height: 22,
  },
  linkedDevices: [],
  groups: [
    {
      id: "test-parent-asset",
      date: Date.now(),
    },
    {
      id: "test-children-asset",
      date: Date.now(),
    },
  ],
};
const assetAyseGroupedId = `${assetAyseGrouped.model}-${assetAyseGrouped.reference}`;

const assetAyseGrouped2 = {
  model: "Container",
  reference: "grouped2",
  measureSlots: Container.definition.measures,
  metadata: {
    weight: 20,
    height: 22,
  },
  linkedDevices: [],
  groups: [
    {
      id: "test-parent-asset",
      date: Date.now(),
    },
    {
      id: "test-children-asset",
      date: Date.now(),
    },
  ],
};
const assetAyseGroupedId2 = `${assetAyseGrouped2.model}-${assetAyseGrouped2.reference}`;

const assetAyseDebug1 = {
  model: "MagicHouse",
  reference: "debug1",
  linkedDevices: [],
  metadata: [],
};

const assetAyseDebug1Id = `${assetAyseDebug1.model}-${assetAyseDebug1.reference}`;

export default {
  "device-manager": {
    devices: internalDevices.map((device) => {
      if ("metadata" in device && device.metadata) {
        const { groups, metadata, linkedMeasures, associatedAt, ...rest } =
          device;
        return {
          ...rest,
          provisionedAt: Date.now(),
        };
      }
      return device;
    }),
  },

  // Index "engine-ayse"
  "engine-ayse": {
    devices: ayseDevices,
    assets: ayseAssets,
    ...groupFixtures,
  },
};
