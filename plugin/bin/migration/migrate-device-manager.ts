#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Upgrades the data of an installation that ran a Device Manager 3
 * pre-release, for the fields the 3-dev line renamed:
 *
 * 1. `engineGroups` -> `tenantClasses` on the model documents;
 * 2. every device-manager engine is updated, so the tenant collections get
 *    the mappings of the migrated models and the `index` field of the devices;
 * 3. `engineId` -> `index` on the device documents, of the platform index and
 *    of every tenant.
 *
 * Run it against a Kuzzle that already runs the new Device Manager version.
 * See doc/3/guides/upgrade-3-pre-release.
 */

import { Http, JSONObject, Kuzzle, WebSocket } from "kuzzle-sdk";

const args: Record<string, string | true> = {};
for (const val of process.argv.slice(2)) {
  if (val.startsWith("--")) {
    const [key, ...value] = val.slice(2).split("=");
    args[key] = value.length > 0 ? value.join("=") : true;
  }
}

function option(name: string, env: string, defaultValue?: string) {
  const value = args[name] ?? process.env[env] ?? defaultValue;
  return typeof value === "string" ? value : undefined;
}

const host = option("host", "KUZZLE_HOST", "localhost");
const port = Number(option("port", "KUZZLE_PORT", "7512"));
const protocol = option("protocol", "KUZZLE_PROTOCOL", "websocket");
const ssl = args.ssl === true || process.env.KUZZLE_SSL === "true";
const username = option("username", "KUZZLE_USERNAME");
const password = option("password", "KUZZLE_PASSWORD");
const platformIndex = option(
  "platform-index",
  "PLATFORM_INDEX",
  "device-manager",
);
const dryRun = args["dry-run"] === true;

const MODELS = "models";
const DEVICES = "devices";
const CHUNK_SIZE = 200;

/** Devices attached before the rename: `engineId` set, `index` not yet */
const LEGACY_DEVICES_QUERY = {
  query: {
    bool: {
      must: [{ exists: { field: "engineId" } }],
      must_not: [{ exists: { field: "index" } }],
    },
  },
};

async function connect(): Promise<Kuzzle> {
  const Protocol = protocol === "http" ? Http : WebSocket;
  const sdk = new Kuzzle(new Protocol(host, { port, ssl }));

  await sdk.connect();

  if (username) {
    await sdk.auth.login("local", { password, username });
  }

  return sdk;
}

async function hasField(
  sdk: Kuzzle,
  index: string,
  collection: string,
  field: string,
) {
  const mappings = await sdk.collection.getMapping(index, collection);

  return Boolean((mappings.properties as JSONObject)?.[field]);
}

async function assertNewMappings(sdk: Kuzzle) {
  const ready =
    (await hasField(sdk, platformIndex, MODELS, "tenantClasses")) &&
    (await hasField(sdk, platformIndex, DEVICES, "index"));

  if (!ready) {
    throw new Error(
      `The "${platformIndex}" collections have no "tenantClasses" or "index" field. ` +
        "Start Kuzzle with the new Device Manager version before running this script.",
    );
  }
}

async function fetchAll(
  sdk: Kuzzle,
  index: string,
  collection: string,
  query: JSONObject,
) {
  const documents: Array<{ _id: string; _source: JSONObject }> = [];
  let result = await sdk.document.search(index, collection, query, {
    lang: "elasticsearch",
    scroll: "1m",
    size: CHUNK_SIZE,
  });

  while (result) {
    documents.push(...result.hits);
    result = await result.next();
  }

  return documents;
}

function assertNoErrors(errors: JSONObject[], what: string) {
  if (errors.length === 0) {
    return;
  }

  for (const error of errors) {
    console.error(`  Cannot migrate ${error.document._id}: ${error.reason}`);
  }
  throw new Error(`${errors.length} ${what} could not be migrated`);
}

async function migrateModels(sdk: Kuzzle) {
  const legacyModels = await fetchAll(sdk, platformIndex, MODELS, {
    query: { exists: { field: "engineGroups" } },
  });

  console.info(`${legacyModels.length} model(s) still use "engineGroups"`);

  const documents = legacyModels.map(({ _id, _source }) => {
    const { engineGroups, ...body } = _source;
    delete body._kuzzle_info;

    // A model registered by the application at startup may already have
    // been rewritten with `tenantClasses`: the new value wins.
    body.tenantClasses ??= engineGroups;

    console.info(`  ${_id}: ${JSON.stringify(body.tenantClasses)}`);

    return { _id, body };
  });

  if (dryRun) {
    return;
  }

  for (let i = 0; i < documents.length; i += CHUNK_SIZE) {
    const { errors } = await sdk.document.mReplace(
      platformIndex,
      MODELS,
      documents.slice(i, i + CHUNK_SIZE),
      { refresh: "wait_for" },
    );
    assertNoErrors(errors, "model(s)");
  }

  const remaining = await sdk.document.count(platformIndex, MODELS, {
    query: { exists: { field: "engineGroups" } },
  });

  if (remaining > 0) {
    throw new Error(`${remaining} model(s) still use "engineGroups"`);
  }
}

async function listEngines(sdk: Kuzzle) {
  const { result } = await sdk.query({
    action: "list",
    controller: "device-manager/engine",
  });

  return result.engines as Array<{ group: string; index: string }>;
}

async function updateEngines(
  sdk: Kuzzle,
  engines: Array<{ group: string; index: string }>,
) {
  console.info(`Updating ${engines.length} engine(s)`);

  for (const engine of engines) {
    console.info(`  ${engine.index} (${engine.group})`);

    if (dryRun) {
      continue;
    }

    await sdk.query({
      action: "update",
      controller: "device-manager/engine",
      group: engine.group,
      index: engine.index,
    });
  }
}

/**
 * Moves `engineId` to `index` with a partial update, so that the measures
 * ingested meanwhile are not overwritten. `engineId` is emptied: a device
 * detached later would otherwise match the legacy query again, and a second
 * run would attach it back.
 */
async function migrateDevices(sdk: Kuzzle, index: string) {
  const legacyDevices = await fetchAll(
    sdk,
    index,
    DEVICES,
    LEGACY_DEVICES_QUERY,
  );

  console.info(
    `  ${index}: ${legacyDevices.length} device(s) still use "engineId"`,
  );

  if (dryRun || legacyDevices.length === 0) {
    return;
  }

  const documents = legacyDevices.map(({ _id, _source }) => ({
    _id,
    body: { engineId: null, index: _source.engineId },
  }));

  for (let i = 0; i < documents.length; i += CHUNK_SIZE) {
    const { errors } = await sdk.document.mUpdate(
      index,
      DEVICES,
      documents.slice(i, i + CHUNK_SIZE),
      { refresh: "wait_for" },
    );
    assertNoErrors(errors, "device(s)");
  }

  const remaining = await sdk.document.count(
    index,
    DEVICES,
    LEGACY_DEVICES_QUERY,
  );

  if (remaining > 0) {
    throw new Error(`${index}: ${remaining} device(s) still use "engineId"`);
  }
}

async function run() {
  const sdk = await connect();

  try {
    if (dryRun) {
      console.info("Dry run: nothing will be written");
    }

    await assertNewMappings(sdk);
    await migrateModels(sdk);

    // Before the devices: the tenant "devices" mappings are strict, and get
    // their "index" field from the engine update
    const engines = await listEngines(sdk);
    await updateEngines(sdk, engines);

    console.info("Migrating the devices");
    await migrateDevices(sdk, platformIndex);
    for (const engine of engines) {
      await migrateDevices(sdk, engine.index);
    }

    console.info("Done");
  } finally {
    sdk.disconnect();
  }
}

run().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
