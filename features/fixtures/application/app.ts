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

deviceManager.models.registerAsset("car", {
  warranty: {
    type: "keyword",
    fields: {
      text: { type: "text" },
    },
  },
});

// Register an asset for the "astronaut" group

deviceManager.models.registerAsset(
  "rocket",
  {
    stillAlive: { type: "boolean" },
  },
  { engineGroup: "astronaut" }
);

deviceManager.models.registerAsset(
  "hevSuit",
  {
    freezing: { type: "boolean" },
  },
  { engineGroup: "astronaut" }
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
