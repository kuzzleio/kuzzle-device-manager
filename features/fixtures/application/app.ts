import util from "node:util";

import { Backend, KuzzleRequest } from "kuzzle";

import { DeviceManagerPlugin } from "../../../index";
import { DummyTempDecoder, DummyTempPositionDecoder } from "./decoders";
import { registerTestPipes } from "./testPipes";

const app = new Backend("kuzzle");

const deviceManager = new DeviceManagerPlugin();

deviceManager.models.registerDevice(
  "DummyTempPosition",
  new DummyTempPositionDecoder(),
  {}
);

deviceManager.models.registerDevice("DummyTemp", new DummyTempDecoder(), {
  color: { type: "keyword" },
});

// Register an asset for the "commons" group

deviceManager.models.registerAsset(
  "commons",
  "container",
  {
    weight: { type: "integer" },
    height: { type: "integer" },
  },
  [
    { name: "temperatureExt", type: "temperature" },
    { name: "temperatureInt", type: "temperature" },
    { name: "position", type: "position" },
  ]
);

deviceManager.models.registerAsset(
  "commons",
  "warehouse",
  {
    surface: { type: "integer" },
  },
  [{ name: "position", type: "position" }]
);

registerTestPipes(app); //TODO : move this line in another filer

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
