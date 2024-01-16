import path from "node:path";
import AggregateError from "aggregate-error";
import { temporaryFile } from "tempy";
import verifyNpmConfig from "@semantic-release/npm/lib/verify-config.js";
import getPkg from "@semantic-release/npm/lib/get-pkg.js";
import verifyNpmAuth from "@semantic-release/npm/lib/verify-auth.js";
import addChannelNpm from "@semantic-release/npm/lib/add-channel.js";
import prepareNpm from "@semantic-release/npm/lib/prepare.js";
import publishNpm from "@semantic-release/npm/lib/publish.js";
import { add } from "@semantic-release/git/lib/git.js";

let verified = false;
let prepared = false;
const typesPath = path.resolve(process.cwd(), "types");

const npmrc = temporaryFile({ name: ".npmrc" });

function typeContext(context) {
  context.cwd = typesPath;
  return context;
}

export async function verifyConditions(pluginConfig, ctx) {
  const context = typeContext(ctx);
  const errors = verifyNpmConfig(pluginConfig);

  try {
    const pkg = await getPkg(pluginConfig, context);

    if (pluginConfig.npmPublish !== false) {
      await verifyNpmAuth(npmrc, pkg, context);
    }
  } catch (error) {
    errors.push(...error.errors);
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  verified = true;
}

export async function prepare(pluginConfig, ctx) {
  const context = typeContext(ctx);
  const { env, cwd } = context;
  await prepareNpm(npmrc, pluginConfig, context);
  await add([path.join(typesPath, "package.json")], { cwd, env });

  prepared = true;
}

export async function publish(pluginConfig, ctx) {
  const context = typeContext(ctx);
  if (pluginConfig.npmPublish === false) {
    context.logger.log(
      `Skip publishing to npm registry as npmPublish is false`
    );
    return false;
  }

  let pkg;
  const errors = verified ? [] : verifyNpmConfig(pluginConfig);

  try {
    // Reload package.json in case a previous external step updated it
    pkg = await getPkg(pluginConfig, context);
    if (
      !verified &&
      pluginConfig.npmPublish !== false &&
      pkg.private !== true
    ) {
      await verifyNpmAuth(npmrc, pkg, context);
    }
  } catch (error) {
    errors.push(...error.errors);
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  if (!prepared) {
    await prepare(pluginConfig, context);
  }

  return await publishNpm(npmrc, pluginConfig, pkg, context);
}

export async function addChannel(pluginConfig, ctx) {
  const context = typeContext(ctx);
  let pkg;
  const errors = verified ? [] : verifyNpmConfig(pluginConfig);

  try {
    // Reload package.json in case a previous external step updated it
    pkg = await getPkg(pluginConfig, context);
    if (
      !verified &&
      pluginConfig.npmPublish !== false &&
      pkg.private !== true
    ) {
      await verifyNpmAuth(npmrc, pkg, context);
    }
  } catch (error) {
    errors.push(...error.errors);
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  return addChannelNpm(npmrc, pluginConfig, pkg, context);
}
