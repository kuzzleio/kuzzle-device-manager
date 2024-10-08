import util from "node:util";

import { Backend, KuzzleRequest } from "kuzzle";

import { DeviceManagerPlugin } from "../../index";

import { containerAssetDefinition } from "./assets/Container";
import { roomAssetDefinition } from "./assets/Room";
import { streetLampAssetDefinition } from "./assets/StreetLamp";
import { warehouseAssetDefinition } from "./assets/Warehouse";
import { DummyTempDecoder, DummyTempPositionDecoder } from "./decoders";
import { TestsController } from "./tests/controller";
import { registerTestPipes } from "./tests/pipes";
import { accelerationMeasureDefinition } from "./measures/AccelerationMeasure";
import { brightnessMeasureDefinition } from "./measures/BrightnessMeasure";
import { co2MeasureDefinition } from "./measures/CO2Measure";
import { illuminanceMeasureDefinition } from "./measures/IlluminanceMeasure";
import { powerConsumptionMeasureDefinition } from "./measures/PowerConsumptionMeasure";

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


deviceManager.models.registerDevice("DummyTempPosition",
  {
    decoder: new DummyTempPositionDecoder(),
    metadataMappings: {
      serial: { type: "keyword" },
    },
  }
);

deviceManager.models.registerDevice("DummyTemp",
  {
    decoder: new DummyTempDecoder(),
    metadataMappings: {
      color: { type: "keyword" },
    },
  }
);

// Register assets for the "commons" group
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

// Register assets for specialized groups
deviceManager.models.registerAsset(
  "air_quality",
  "Room",
  roomAssetDefinition
);

deviceManager.models.registerAsset(
  "public_lighting",
  "StreetLamp",
  streetLampAssetDefinition
);

deviceManager.models.registerMeasure("acceleration", accelerationMeasureDefinition);
deviceManager.models.registerMeasure("brightness", brightnessMeasureDefinition);
deviceManager.models.registerMeasure("co2", co2MeasureDefinition);
deviceManager.models.registerMeasure("illuminance", illuminanceMeasureDefinition);
deviceManager.models.registerMeasure("powerConsumption", powerConsumptionMeasureDefinition);

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
