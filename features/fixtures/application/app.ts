import util from "node:util";

import { Backend, KuzzleRequest } from "kuzzle";

import { DeviceManagerPlugin } from "../../../index";
import { DummyTempDecoder, DummyTempPositionDecoder } from "./decoders";
import { registerTestPipes } from "./testPipes";

const app = new Backend("kuzzle");

const deviceManager = new DeviceManagerPlugin();

deviceManager.registerDecoder(new DummyTempDecoder());
deviceManager.registerDecoder(new DummyTempPositionDecoder());

deviceManager.models.registerDevice("DummyTemp", {
  color: { type: "keyword" },
});

// Register an asset for the "commons" group

deviceManager.models.registerAsset(
  "container",
  {
    weight: { type: "integer" },
    height: { type: "integer" },
  },
  { engineGroup: "commons" }
);

deviceManager.models.registerAsset(
  "warehouse",
  {
    surface: { type: "integer" },
  },
  { engineGroup: "commons" }
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
