import { AssetContent } from "../../index";

export const assetAyseWarehouseLinked: AssetContent = {
  model: "Warehouse",
  reference: "linked",
  measureSlots: [
    {
      name: "position",
      type: "position",
    },
  ],
  metadata: {
    surface: 512,
  },
  linkedDevices: [
    {
      measureNames: [
        {
          asset: "position",
          device: "position",
          type: "position",
        },
      ],
      _id: "DummyTempPosition-warehouse",
    },
  ],
  groups: [],
};
export const assetAyseWarehouseLinkedId = `${assetAyseWarehouseLinked.model}-${assetAyseWarehouseLinked.reference}`;
export const assetAyseWarehouseLinked2: AssetContent = {
  model: "Warehouse",
  reference: "linked2",
  measureSlots: [
    {
      name: "position",
      type: "position",
    },
  ],
  metadata: {
    surface: 512,
  },
  linkedDevices: [
    {
      measureNames: [
        {
          asset: "position",
          device: "position",
          type: "position",
        },
      ],
      _id: "DummyTempPosition-linked2",
    },
  ],
  groups: [],
};
export const assetAyseWarehouseLinked2Id = `${assetAyseWarehouseLinked2.model}-${assetAyseWarehouseLinked2.reference}`;

export const assetAyseLinked1: AssetContent = {
  model: "Container",
  reference: "linked1",
  measureSlots: [
    {
      name: "temperatureExt",
      type: "temperature",
    },
    {
      name: "temperatureInt",
      type: "temperature",
    },
    {
      name: "position",
      type: "position",
    },
    {
      name: "temperatureWeather",
      type: "temperature",
    },
  ],
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
      measureNames: [
        {
          asset: "temperatureExt",
          device: "temperature",
          type: "temperature",
        },
      ],
      _id: "DummyTemp-linked1",
    },
  ],
  groups: [],
};
export const assetAyseLinked1Id = `${assetAyseLinked1.model}-${assetAyseLinked1.reference}`;

export const assetAyseLinked2: AssetContent = {
  model: "Container",
  reference: "linked2",
  measureSlots: [
    {
      name: "temperatureExt",
      type: "temperature",
    },
    {
      name: "temperatureInt",
      type: "temperature",
    },
    {
      name: "position",
      type: "position",
    },
    {
      name: "temperatureWeather",
      type: "temperature",
    },
  ],
  metadata: {
    weight: 42,
    height: 21,
  },
  linkedDevices: [
    {
      measureNames: [
        {
          asset: "temperatureExt",
          device: "temperature",
          type: "temperature",
        },
        {
          asset: "position",
          device: "position",
          type: "position",
        },
      ],
      _id: "DummyTempPosition-linked2",
    },
  ],
  groups: [],
};
export const assetAyseLinked2Id = `${assetAyseLinked2.model}-${assetAyseLinked2.reference}`;

export const assetAyseUnlinked: AssetContent = {
  model: "Container",
  reference: "unlinked1",
  measureSlots: [
    {
      name: "temperatureExt",
      type: "temperature",
    },
    {
      name: "temperatureInt",
      type: "temperature",
    },
    {
      name: "position",
      type: "position",
    },
    {
      name: "temperatureWeather",
      type: "temperature",
    },
  ],
  metadata: {
    weight: 20,
    height: 22,
  },
  linkedDevices: [],
  groups: [],
};
export const assetAyseUnlinkedId = `${assetAyseUnlinked.model}-${assetAyseUnlinked.reference}`;

export const assetAyseGrouped: AssetContent = {
  model: "Container",
  reference: "grouped",
  measureSlots: [
    {
      name: "temperatureExt",
      type: "temperature",
    },
    {
      name: "temperatureInt",
      type: "temperature",
    },
    {
      name: "position",
      type: "position",
    },
    {
      name: "temperatureWeather",
      type: "temperature",
    },
  ],
  metadata: {
    weight: 20,
    height: 22,
  },
  linkedDevices: [],
  groups: [
    {
      path: "test-parent-asset.test-children-asset",
      date: Date.now(),
    },
  ],
};
export const assetAyseGroupedId = `${assetAyseGrouped.model}-${assetAyseGrouped.reference}`;

export const assetAyseGrouped2: AssetContent = {
  model: "Container",
  reference: "grouped2",
  measureSlots: [
    {
      name: "temperatureExt",
      type: "temperature",
    },
    {
      name: "temperatureInt",
      type: "temperature",
    },
    {
      name: "position",
      type: "position",
    },
    {
      name: "temperatureWeather",
      type: "temperature",
    },
  ],
  metadata: {
    weight: 20,
    height: 22,
  },
  linkedDevices: [],
  groups: [
    {
      path: "test-parent-asset",
      date: Date.now(),
    },
  ],
};
export const assetAyseGroupedId2 = `${assetAyseGrouped2.model}-${assetAyseGrouped2.reference}`;

export const assetAyseDebug1: AssetContent = {
  model: "MagicHouse",
  reference: "debug1",
  measureSlots: [
    {
      name: "magiculeExt",
      type: "magicule",
    },
    {
      name: "magiculeInt",
      type: "magicule",
    },
  ],
  metadata: {},
  linkedDevices: [],
  groups: [],
};

export const assetAyseDebug1Id = `${assetAyseDebug1.model}-${assetAyseDebug1.reference}`;

export const ayseAssets = [
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

  { index: { _id: assetAyseDebug1Id } },
  assetAyseDebug1,
  { index: { _id: assetAyseWarehouseLinked2Id } },
  assetAyseWarehouseLinked2,
];
