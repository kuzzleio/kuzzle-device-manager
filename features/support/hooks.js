const _ = require("lodash");
const { After, Before, BeforeAll } = require("cucumber");
const { Kuzzle, WebSocket } = require("kuzzle-sdk");

const defaultFixtures = require("../fixtures/fixtures");
const defaultRights = require("../fixtures/rights");
const defaultMappings = require("../fixtures/mappings");

const World = require("./world");

async function resetEngine(sdk, index) {
  await sdk
    .query({
      controller: "device-manager/engine",
      action: "delete",
      index,
    })
    .catch(() => {});

  await sdk.query({
    controller: "device-manager/engine",
    action: "create",
    index,
  });
}

async function createEngine(sdk, index) {
  const { result } = await sdk.query({
    controller: "device-manager/engine",
    action: "exists",
    index,
  });

  if (result.exists) {
    return;
  }

  await sdk.query({
    controller: "device-manager/engine",
    action: "create",
    index,
  });
}

BeforeAll({ timeout: 30 * 1000 }, async function () {
  const world = new World({});

  world.sdk = new Kuzzle(new WebSocket(world.host, { port: world.port }));

  console.log(`Connecting to Kuzzle at ${world.host}:${world.port}..`);

  await world.sdk.connect();

  await Promise.all([
    createEngine(world.sdk, "engine-ayse"),
    createEngine(world.sdk, "engine-kuzzle"),
    world.sdk.query({
      controller: "admin",
      action: "loadMappings",
      body: defaultMappings,
    }),
    world.sdk.query({
      controller: "admin",
      action: "loadSecurities",
      body: defaultRights,
      refresh: "wait_for",
      onExistingUsers: "overwrite",
    }),
  ]);

  world.sdk.disconnect();
});

Before({ timeout: 30 * 1000 }, async function () {
  this.props.now = Date.now();
  this.props.i = 1;

  this.sdk = new Kuzzle(new WebSocket(this.host, { port: this.port }));

  await this.sdk.connect();

  await Promise.all([
    truncateCollection(this.sdk, "device-manager", "devices"),
    truncateCollection(this.sdk, "device-manager", "payloads"),

    truncateCollection(this.sdk, "engine-kuzzle", "assets"),
    truncateCollection(this.sdk, "engine-kuzzle", "measures"),
    truncateCollection(this.sdk, "engine-kuzzle", "devices"),

    truncateCollection(this.sdk, "engine-ayse", "assets"),
    truncateCollection(this.sdk, "engine-ayse", "measures"),
    truncateCollection(this.sdk, "engine-ayse", "devices"),

    truncateCollection(this.sdk, "tests", "events"),
  ]);

  try {
    await this.sdk.query({
      controller: "admin",
      action: "loadFixtures",
      refresh: "false",
      body: defaultFixtures,
    });
  } catch (error) {
    console.dir(error, { depth: 10 });
    throw error;
  }
});

After(async function () {
  // Clean values stored by the scenario
  this.props = {};

  if (this.sdk && typeof this.sdk.disconnect === "function") {
    this.sdk.disconnect();
  }
});

// security hooks ==============================================================

After({ tags: "@security", timeout: 60 * 1000 }, async function () {
  await resetSecurityDefault(this.sdk);
});

async function resetSecurityDefault(sdk) {
  await sdk.query({
    controller: "admin",
    action: "resetSecurity",
    refresh: "wait_for",
  });

  sdk.jwt = null;

  await sdk.query({
    controller: "admin",
    action: "loadSecurities",
    body: defaultRights,
    refresh: "wait_for",
    onExistingUsers: "overwrite",
  });
}

// realtime hooks ==============================================================

After({ tags: "@realtime" }, function () {
  if (_.isEmpty(this.props.subscriptions)) {
    throw new Error(
      "@realtime time has been set but no subscriptions have been made."
    );
  }

  const promises = Object.values(this.props.subscriptions).map(
    ({ unsubscribe }) => unsubscribe()
  );

  return Promise.all(promises);
});

After({ tags: "@manual-provisioning", timeout: 60 * 1000 }, async function () {
  await this.sdk.document.update(
    "device-manager",
    "config",
    "plugin--device-manager",
    {
      "device-manager": {
        provisioningStrategy: "auto",
      },
    }
  );
});

// engine hooks ================================================================

After({ tags: "@reset-engines", timeout: 60 * 1000 }, async function () {
  const world = new World({});

  world.sdk = new Kuzzle(new WebSocket(world.host, { port: world.port }));

  await world.sdk.connect();

  await Promise.all([
    resetEngine(world.sdk, "engine-ayse"),
    resetEngine(world.sdk, "engine-kuzzle"),
  ]);
});

// cleaning hooks ==============================================================

Before({ tags: "@tenant-custom" }, async function () {
  try {
    await this.sdk.query({
      controller: "device-manager/engine",
      action: "delete",
      index: "tenant-custom",
    });
  } catch {}
});

async function truncateCollection(sdk, index, collection) {
  return sdk.collection
    .refresh(index, collection)
    .then(() =>
      sdk.document.deleteByQuery(index, collection, {}, { refresh: "wait_for" })
    )
    .catch((error) => {
      if (!error.message.includes("does not exist")) {
        throw error;
      }
    });
}
