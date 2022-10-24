const { Asset } = require("../../lib/modules/asset");
const { Device } = require("../../lib/modules/device");

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
  metadata: {},
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
  metadata: {},
  deviceLinks: [],
});

module.exports = {
  "device-manager": {
    devices: [
      { index: { _id: deviceAyseLinked1._id } },
      deviceAyseLinked1._source,
    ],
  },

  // Index "engine-ayse"
  "engine-ayse": {
    devices: [
      { index: { _id: deviceAyseLinked1._id } },
      deviceAyseLinked1._source,
    ],
    assets: [
      { index: { _id: assetAyseLinked._id } },
      assetAyseLinked._source,
      { index: { _id: assetAyseUnlinked._id } },
      assetAyseUnlinked._source,
    ],
  },
};
