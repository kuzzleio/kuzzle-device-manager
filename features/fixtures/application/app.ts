import util from "node:util";

import { Backend, KuzzleRequest } from "kuzzle";

import { DeviceManagerPlugin } from "../../../index";

import { DummyTempDecoder, DummyTempPositionDecoder } from "./decoders";
import { registerTestPipes } from "./testPipes";
import { containerAssetDefinition } from "./assets/Container";
import { warehouseAssetDefinition } from "./assets/Warehouse";

const app = new Backend("kuzzle");

const deviceManager = new DeviceManagerPlugin();

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

deviceManager.models.registerMeasure("acceleration", {
  valuesMappings: {
    x: { type: "float" },
    y: { type: "float" },
    z: { type: "float" },
  },
});

registerTestPipes(app);

app.plugin.use(deviceManager);

app.hook.register("request:onError", async (request: KuzzleRequest) => {
  app.log.error(request.error);
});

util.inspect.defaultOptions = {
  depth: 10,
};
app.config.content.plugins["kuzzle-plugin-logger"].services.stdout.level =
  "debug";
app.config.content.limits.documentsWriteCount = 5000;

app
  .start()
  .then(() => {
    app.log.info("Application started");
  })
  .catch(console.error);
