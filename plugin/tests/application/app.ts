import util from "node:util";

import { Backend, KuzzleRequest } from "kuzzle";

import { DeviceManagerPlugin } from "../../index";
import { TestsController } from "./tests/controller";
import { registerTestPipes } from "./tests/pipes";
import { registerModels } from "./models";

const app = new Backend("kuzzle");

const deviceManager = new DeviceManagerPlugin();

//? Add custom mapping properties
if (deviceManager.config.engineCollections.asset.mappings.properties) {
  (
    deviceManager.config.engineCollections.asset.mappings.properties as any
  ).custom = {
    type: "keyword",
    fields: { text: { type: "text" } },
  };
}
if (deviceManager.config.engineCollections.device.mappings.properties) {
  (
    deviceManager.config.engineCollections.device.mappings.properties as any
  ).custom = {
    type: "keyword",
    fields: { text: { type: "text" } },
  };
}
if (deviceManager.config.engineCollections.assetGroups.mappings.properties) {
  (
    deviceManager.config.engineCollections.assetGroups.mappings
      .properties as any
  ).custom = {
    type: "keyword",
    fields: { text: { type: "text" } },
  };
}

registerModels(deviceManager);
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
app.config.content.limits.documentsWriteCount = 5000;

app
  .start()
  .then(() => {
    app.log.info("Application started");
  })
  .catch(app.log.error);
