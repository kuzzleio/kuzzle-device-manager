import { assetGroupFixtures } from "./assetsGroups";

const deviceDetached1 = {
  model: "DummyTemp",
  reference: "detached1",
  metadata: {},
  measures: {},
};
const deviceDetached1Id = `${deviceDetached1.model}-${deviceDetached1.reference}`;

const deviceAyseLinked1 = {
  model: "DummyTemp",
  reference: "linked1",
  metadata: {},
  measures: {},
  engineId: "engine-ayse",
  assetId: "Container-linked1",
};
const deviceAyseLinked1Id = `${deviceAyseLinked1.model}-${deviceAyseLinked1.reference}`;

const deviceAyseLinked2 = {
  model: "DummyTempPosition",
  reference: "linked2",
  metadata: {},
  measures: {},
  engineId: "engine-ayse",
  assetId: "Container-linked2",
};
const deviceAyseLinked2Id = `${deviceAyseLinked2.model}-${deviceAyseLinked2.reference}`;

const deviceAyseUnlinked1 = {
  model: "DummyTemp",
  reference: "unlinked1",
  metadata: {},
  measures: {},
  engineId: "engine-ayse",
  assetId: null,
};
const deviceAyseUnlinked1Id = `${deviceAyseUnlinked1.model}-${deviceAyseUnlinked1.reference}`;

const deviceAyseUnlinked2 = {
  model: "DummyTemp",
  reference: "unlinked2",
  metadata: {},
  measures: {},
  engineId: "engine-ayse",
  assetId: null,
};
const deviceAyseUnlinked2Id = `${deviceAyseUnlinked2.model}-${deviceAyseUnlinked2.reference}`;

const deviceAyseUnlinked3 = {
  model: "DummyTempPosition",
  reference: "unlinked3",
  metadata: {},
  measures: {},
  engineId: "engine-ayse",
  assetId: null,
};
const deviceAyseUnlinked3Id = `${deviceAyseUnlinked3.model}-${deviceAyseUnlinked3.reference}`;

const deviceAyseWarehouse = {
  model: "DummyTempPosition",
  reference: "warehouse",
  metadata: {},
  measures: {},
  engineId: "engine-ayse",
  assetId: "Warehouse-linked",
};
const deviceAyseWarehouseId = `${deviceAyseWarehouse.model}-${deviceAyseWarehouse.reference}`;

const assetAyseWarehouseLinked = {
  model: "Warehouse",
  reference: "linked",
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

export default {
  "device-manager": {
    devices: [
      { index: { _id: deviceAyseLinked1Id } },
      deviceAyseLinked1,

      { index: { _id: deviceAyseLinked2Id } },
      deviceAyseLinked2,

      { index: { _id: deviceDetached1Id } },
      deviceDetached1,

      { index: { _id: deviceAyseUnlinked1Id } },
      deviceAyseUnlinked1,

      { index: { _id: deviceAyseUnlinked2Id } },
      deviceAyseUnlinked2,

      { index: { _id: deviceAyseUnlinked3Id } },
      deviceAyseUnlinked3,

      { index: { _id: deviceAyseWarehouseId } },
      deviceAyseWarehouse,
    ],
  },

  // Index "engine-ayse"
  "engine-ayse": {
    devices: [
      { index: { _id: deviceAyseLinked1Id } },
      deviceAyseLinked1,

      { index: { _id: deviceAyseLinked2Id } },
      deviceAyseLinked2,

      { index: { _id: deviceAyseUnlinked1Id } },
      deviceAyseUnlinked1,

      { index: { _id: deviceAyseUnlinked2Id } },
      deviceAyseUnlinked2,

      { index: { _id: deviceAyseUnlinked3Id } },
      deviceAyseUnlinked3,

      { index: { _id: deviceAyseWarehouseId } },
      deviceAyseWarehouse,
    ],
    assets: [
      { index: { _id: assetAyseLinked1Id } },
      assetAyseLinked1,

      { index: { _id: assetAyseLinked2Id } },
      assetAyseLinked2,

      { index: { _id: assetAyseUnlinkedId } },
      assetAyseUnlinked,

      { index: { _id: assetAyseGroupedId } },
      assetAyseGrouped,

      { index: { _id: assetAyseGroupedId2 } },
      assetAyseGrouped2,

      { index: { _id: assetAyseWarehouseLinkedId } },
      assetAyseWarehouseLinked,
    ],
    ...assetGroupFixtures,
  },
};
