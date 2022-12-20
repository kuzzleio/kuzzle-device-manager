import util from "node:util";

import { Backend, KuzzleRequest } from "kuzzle";

import { DeviceManagerPlugin } from "../../../index";
import { DummyTempDecoder, DummyTempPositionDecoder } from "./decoders";
import { registerTestPipes } from "./testPipes";

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

deviceManager.models.registerAsset("commons", "Container", {
  measuresNames: [
    { name: "temperatureExt", type: "temperature" },
    { name: "temperatureInt", type: "temperature" },
    { name: "position", type: "position" },
  ],
  metadataMappings: {
    weight: { type: "integer" },
    height: { type: "integer" },
  },
  defaultMetadata: {
    height: 20,
  },
});

deviceManager.models.registerAsset("commons", "Warehouse", {
  measuresNames: [{ name: "position", type: "position" }],
  metadataMappings: {
    surface: { type: "integer" },
  },
});

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
