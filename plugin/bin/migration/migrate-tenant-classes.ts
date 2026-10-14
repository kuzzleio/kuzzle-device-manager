#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Renames the `engineGroups` field of the model documents to `tenantClasses`,
 * then updates every device-manager engine so the tenant collections get the
 * mappings of the migrated models.
 *
 * Run it against a Kuzzle that already runs the new Device Manager version.
 * See doc/3/guides/rename-engine-groups-to-tenant-classes.
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
const skipEngines = args["skip-engines"] === true;

const MODELS = "models";
const CHUNK_SIZE = 200;

async function connect(): Promise<Kuzzle> {
  const Protocol = protocol === "http" ? Http : WebSocket;
  const sdk = new Kuzzle(new Protocol(host, { port, ssl }));

  await sdk.connect();

  if (username) {
    await sdk.auth.login("local", { password, username });
  }

  return sdk;
}

async function assertNewMappings(sdk: Kuzzle) {
  const mappings = await sdk.collection.getMapping(platformIndex, MODELS);

  if (!(mappings.properties as JSONObject)?.tenantClasses) {
    throw new Error(
      `The "${platformIndex}:${MODELS}" collection has no "tenantClasses" field. ` +
        "Start Kuzzle with the new Device Manager version before running this script.",
    );
  }
}

async function fetchLegacyModels(sdk: Kuzzle) {
  const documents: Array<{ _id: string; _source: JSONObject }> = [];
  let result = await sdk.document.search(
    platformIndex,
    MODELS,
    { query: { exists: { field: "engineGroups" } } },
    { lang: "elasticsearch", scroll: "1m", size: CHUNK_SIZE },
  );

  while (result) {
    documents.push(...result.hits);
    result = await result.next();
  }

  return documents;
}

async function migrateModels(sdk: Kuzzle) {
  const legacyModels = await fetchLegacyModels(sdk);

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

    if (errors.length > 0) {
      for (const error of errors) {
        console.error(
          `  Cannot migrate ${error.document._id}: ${error.reason}`,
        );
      }
      throw new Error(`${errors.length} model(s) could not be migrated`);
    }
  }

  const remaining = await sdk.document.count(platformIndex, MODELS, {
    query: { exists: { field: "engineGroups" } },
  });

  if (remaining > 0) {
    throw new Error(`${remaining} model(s) still use "engineGroups"`);
  }
}

async function updateEngines(sdk: Kuzzle) {
  const { result } = await sdk.query({
    action: "list",
    controller: "device-manager/engine",
  });
  const engines = result.engines as Array<{ group: string; index: string }>;

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

async function run() {
  const sdk = await connect();

  try {
    if (dryRun) {
      console.info("Dry run: nothing will be written");
    }

    await assertNewMappings(sdk);
    await migrateModels(sdk);

    if (!skipEngines) {
      await updateEngines(sdk);
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
