const { Asset } = require("../../lib/modules/asset");
const { Device } = require("../../lib/modules/device");

const deviceDetached1 = new Device({
  model: "DummyTemp",
  reference: "detached1",
  metadata: {},
  measures: [],
});

const deviceAyseLinked1 = new Device({
  model: "DummyTemp",
  reference: "linked1",
  metadata: {},
  measures: [],
  engineId: "engine-ayse",
  assetId: "container-linked1",
});

const assetAyseLinked = new Asset({
  model: "container",
  reference: "linked1",
  metadata: {
    weight: 10,
    height: 11,
  },
  deviceLinks: [
    {
      measureNamesLinks: [],
      deviceId: "DummyTemp-linked1",
    },
  ],
});

const assetAyseUnlinked = new Asset({
  model: "container",
  reference: "unlinked1",
  metadata: {
    weight: 20,
    height: 22,
  },
  deviceLinks: [],
});

const deviceAyseUnlinked1 = new Device({
  model: "DummyTemp",
  reference: "unlinked1",
  metadata: {},
  measures: [],
  engineId: "engine-ayse",
  assetId: null,
});

module.exports = {
  "device-manager": {
    devices: [
      { index: { _id: deviceAyseLinked1._id } },
      deviceAyseLinked1._source,
      { index: { _id: deviceDetached1._id } },
      deviceDetached1._source,
      { index: { _id: deviceAyseUnlinked1._id } },
      deviceAyseUnlinked1._source,
    ],
  },

  // Index "engine-ayse"
  "engine-ayse": {
    devices: [
      { index: { _id: deviceAyseLinked1._id } },
      deviceAyseLinked1._source,
      { index: { _id: deviceAyseUnlinked1._id } },
      deviceAyseUnlinked1._source,
    ],
    assets: [
      { index: { _id: assetAyseLinked._id } },
      assetAyseLinked._source,
      { index: { _id: assetAyseUnlinked._id } },
      assetAyseUnlinked._source,
    ],
  },
};
