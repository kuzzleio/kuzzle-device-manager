import util from "node:util";

import { Backend, KuzzleRequest } from "kuzzle";

import { DeviceManagerPlugin } from "../../index";

import { containerAssetDefinition } from "./assets/Container";
import { warehouseAssetDefinition } from "./assets/Warehouse";
import { DummyTempDecoder, DummyTempPositionDecoder } from "./decoders";
import { TestsController } from "./tests/controller";
import { registerTestPipes } from "./tests/pipes";
import { accelerationMeasureDefinition } from "./measures/AccelerationMeasure";
import { magicHouseAssetDefinition } from "./assets/MagicHouse";
import { magiculeMeasureDefinition } from "./measures/Magicule";

const app = new Backend("kuzzle");

const deviceManager = new DeviceManagerPlugin();

//? Add custom mapping properties
deviceManager.config.engineCollections.asset.mappings.properties["softTenant"] = {
  type: "keyword",
  fields: { text: { type: "text" } },
};
deviceManager.config.engineCollections.device.mappings.properties["softTenant"] = {
  type: "keyword",
  fields: { text: { type: "text" } },
};


deviceManager.models.registerDevice("DummyTempPosition", {
  decoder: new DummyTempPositionDecoder(),
  metadataMappings: {
    serial: { type: "keyword" },
  },
});

deviceManager.models.registerDevice("DummyTemp", {
  decoder: new DummyTempDecoder(),
  metadataMappings: {
    color: { type: "keyword" },
  },
});

// Register an asset for the "commons" group

deviceManager.models.registerAsset(
  "commons",
  "Container",
  containerAssetDefinition
);

deviceManager.models.registerAsset(
  "commons",
  "Warehouse",
  warehouseAssetDefinition
);

deviceManager.models.registerAsset(
  "commons",
  "MagicHouse",
  magicHouseAssetDefinition
)

deviceManager.models.registerMeasure("acceleration", accelerationMeasureDefinition);
deviceManager.models.registerMeasure("magicule", magiculeMeasureDefinition)

registerTestPipes(app);

app.plugin.use(deviceManager);

app.controller.use(new TestsController(app));

app.hook.register("request:onError", async (request: KuzzleRequest) => {
  app.log.error(request.error);
});

util.inspect.defaultOptions = {
  depth: 10,
};
// @ts-ignore
app.config.content.plugins["kuzzle-plugin-logger"].services.stdout.level =
  "debug";
// @ts-ignore
app.config.content.limits.documentsWriteCount = 5000;

app
  .start()
  .then(() => {
    app.log.info("Application started");
  })
  .catch(console.error);
