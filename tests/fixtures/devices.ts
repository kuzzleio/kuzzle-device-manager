import { DeviceContent } from "../../index";

export const deviceDetached1: DeviceContent = {
  model: "DummyTemp",
  reference: "detached1",
  measureSlots: [],
  metadata: {},
  measures: {},
  engineId: null,
  assetId: null,
  lastMeasuredAt: null,
};
export const deviceDetached1Id = `${deviceDetached1.model}-${deviceDetached1.reference}`;

export const deviceAyseLinked1 = {
  model: "DummyTemp",
  reference: "linked1",
  measureSlots: [],
  metadata: {},
  measures: {},
  engineId: "engine-ayse",
  assetId: "Container-linked1",
  lastMeasuredAt: null,
};
export const deviceAyseLinked1Id = `${deviceAyseLinked1.model}-${deviceAyseLinked1.reference}`;

export const deviceAyseLinked2: DeviceContent = {
  model: "DummyTempPosition",
  reference: "linked2",
  measureSlots: [],
  metadata: {},
  measures: {},
  engineId: "engine-ayse",
  assetId: "Container-linked2",
  lastMeasuredAt: null,
};
export const deviceAyseLinked2Id = `${deviceAyseLinked2.model}-${deviceAyseLinked2.reference}`;

export const deviceAyseUnlinked1: DeviceContent = {
  model: "DummyTemp",
  reference: "unlinked1",
  measureSlots: [],
  metadata: {},
  measures: {},
  engineId: "engine-ayse",
  assetId: null,
  lastMeasuredAt: null,
};
export const deviceAyseUnlinked1Id = `${deviceAyseUnlinked1.model}-${deviceAyseUnlinked1.reference}`;

export const deviceAyseUnlinked2: DeviceContent = {
  model: "DummyTemp",
  reference: "unlinked2",
  measureSlots: [],
  metadata: {},
  measures: {},
  engineId: "engine-ayse",
  assetId: null,
  lastMeasuredAt: null,
};
export const deviceAyseUnlinked2Id = `${deviceAyseUnlinked2.model}-${deviceAyseUnlinked2.reference}`;

export const deviceAyseUnlinked3: DeviceContent = {
  model: "DummyTempPosition",
  reference: "unlinked3",
  measureSlots: [],
  metadata: {},
  measures: {},
  engineId: "engine-ayse",
  assetId: null,
  lastMeasuredAt: null,
};
export const deviceAyseUnlinked3Id = `${deviceAyseUnlinked3.model}-${deviceAyseUnlinked3.reference}`;

export const deviceAyseWarehouse: DeviceContent = {
  model: "DummyTempPosition",
  reference: "warehouse",
  measureSlots: [],
  metadata: {},
  measures: {},
  engineId: "engine-ayse",
  assetId: "Warehouse-linked",
  lastMeasuredAt: null,
};
export const deviceAyseWarehouseId = `${deviceAyseWarehouse.model}-${deviceAyseWarehouse.reference}`;

export const deviceEmptyTemp: DeviceContent = {
  model: "EmptyTemp",
  reference: "empty",
  measureSlots: [],
  metadata: {
    color: "BLUE",
  },
  measures: {},
  engineId: "engine-ayse",
  assetId: null,
  lastMeasuredAt: null,
};
export const deviceEmptyTempId = `${deviceEmptyTemp.model}-${deviceEmptyTemp.reference}`;

export const internalDevices = [
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

  { index: { _id: deviceEmptyTempId } },
  deviceEmptyTemp,
];

export const ayseDevices = [
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

  { index: { _id: deviceEmptyTempId } },
  deviceEmptyTemp,
];
