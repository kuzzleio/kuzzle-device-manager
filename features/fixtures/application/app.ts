import { Backend, KuzzleRequest } from "kuzzle";

import { DeviceManagerPlugin } from "../../../index";
import { DummyTempDecoder, DummyTempPositionDecoder } from "./decoders";
import { registerTestPipes } from "./testPipes";

const app = new Backend("kuzzle");

const deviceManager = new DeviceManagerPlugin();

deviceManager.decoders.register(new DummyTempDecoder());
deviceManager.decoders.register(new DummyTempPositionDecoder());

deviceManager.devices.registerMetadata({
  color: { type: "keyword" },
});

deviceManager.assets.register("car", {
  warranty: {
    type: "keyword",
    fields: {
      text: { type: "text" },
    },
  },
});

// Register an asset for the "astronaut" group

deviceManager.assets.register(
  "rocket",
  {
    stillAlive: { type: "boolean" },
  },
  { engineGroup: "astronaut" }
);

deviceManager.assets.register(
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

app.config.content.plugins["kuzzle-plugin-logger"].services.stdout.level =
  "debug";
app.config.content.limits.documentsWriteCount = 5000;

app
  .start()
  .then(() => {
    app.log.info("Application started");
  })
  .catch(console.error);
