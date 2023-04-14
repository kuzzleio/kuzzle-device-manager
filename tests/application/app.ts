import util from "node:util";

import { Backend, HttpStream, KuzzleRequest } from "kuzzle";

import { DeviceManagerPlugin } from "../../index";

import { DummyTempDecoder, DummyTempPositionDecoder } from "./decoders";
import { registerTestPipes } from "./tests/pipes";
import { TestsController } from "./tests/controller";
import { containerAssetDefinition } from "./assets/Container";
import { warehouseAssetDefinition } from "./assets/Warehouse";
import { PassThrough } from "node:stream";

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

let searchQuery;

async function sendResult(stream, searchQuery) {
  let result = await app.sdk.document.search(
    "device-manager",
    "payloads",
    {
      query: searchQuery,
    },
    { scroll: "5s" }
  );

  while (result) {
    for (const hit of result.hits) {
      stream.write(JSON.stringify(hit));
    }

    result = await result.next();
  }

  stream.end();
}

app.controller.register("download", {
  actions: {
    do: {
      handler: async (request: KuzzleRequest) => {
        if (request.context.connection.protocol !== "http") {
          throw new Error("This route is only available through HTTP");
        }

        // if (request.context.connection.misc.verb === "POST") {
        //   searchQuery = request.input.body;
        //   request.response.configure({
        //     format: "raw",
        //     // HTTP status code for redirection
        //     status: 302,
        //     headers: {
        //       Location: "/download",
        //       "X-Kuzzle-Redirect": "true",
        //     },
        //   });

        //   return;
        // }
        // console.log("GET");

        const stream = new PassThrough();

        request.response.configure({
          headers: {
            "Content-Disposition": `attachment; filename="export.jsonl"`,
            "Content-Type": "text/csv",
          },
        });

        sendResult(stream, request.input.body);

        return new HttpStream(stream);
      },
      http: [
        { verb: "get", path: "/download" },
        { verb: "post", path: "/download" },
      ],
    },
  },
});

app
  .start()
  .then(() => {
    app.log.info("Application started");
  })
  .catch(console.error);
