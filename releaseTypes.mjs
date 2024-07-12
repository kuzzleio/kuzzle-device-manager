import path from "node:path";
import AggregateError from "aggregate-error";
import { temporaryFile } from "tempy";
import SemanticReleaseError from "@semantic-release/error";
import { add } from "@semantic-release/git/lib/git.js";

import {
  getError,
  getPkg,
  verifyNpmAuth,
  npmVersion,
  npmDistTag,
  npmPublish,
} from "./scripts/npm/index.mjs";

/**
 * @typedef {import("./scripts/npm/types").PluginConfig} PluginConfig
 */

/**
 * @typedef {Object} OptionsContext
 * @prop {import("semantic-release").GlobalConfig} options
 */

let verified = false;
let prepared = false;
const typesPath = path.resolve(process.cwd(), "types");

const npmrc = temporaryFile({ name: ".npmrc" });

/**
 * @param {T} context
 * @template T
 * @returns {T}
 */
function typeContext(context) {
  context.cwd = typesPath;
  return context;
}

/**
 * Check if the plugin is defined before the plugin `@semantic-release/git` if it's defined.
 *
 * @param {import("semantic-release").VerifyConditionsContext & OptionsContext} context semantic-release context.
 */
function checkPluginsOrder(context) {
  const pluginsList = context.options.plugins.map((plugin) =>
    Array.isArray(plugin) ? plugin[0] : plugin,
  );
  const gitPluginIndex = pluginsList.indexOf("@semantic-release/git");

  if (gitPluginIndex === -1) {
    return;
  }

  const pluginIndex = pluginsList.findIndex((plugin) =>
    plugin.includes(path.basename(import.meta.url)),
  );
  if (pluginIndex > gitPluginIndex) {
    throw new SemanticReleaseError(
      "This plugin should be defined before plugin `@semantic-release/git`",
      "EINVALIDSETUP",
    );
  }
}

/**
 * Verify the npm configuration and plugin setup:
 * - The plugin should be define before the plugin `@semantic-release/git` if it's defined.
 *
 * @param {PluginConfig} pluginConfig The plugin configuration.
 * @param {import("semantic-release").VerifyConditionsContext & OptionsContext} ctx semantic-release context.
 */
export async function verifyConditions(pluginConfig, ctx) {
  const context = typeContext(ctx);
  const errors = [];

  try {
    checkPluginsOrder(context);
  } catch (error) {
    errors.push(error);
  }

  // ? Check if `npmPublish` is boolean
  if (
    pluginConfig.npmPublish !== undefined &&
    pluginConfig.npmPublish !== true &&
    pluginConfig.npmPublish !== false
  ) {
    errors.push(getError("EINVALIDNPMPUBLISH", pluginConfig));
  }

  try {
    if (pluginConfig.npmPublish !== false) {
      const pkg = await getPkg(context.cwd);
      await verifyNpmAuth(npmrc, pkg, context);
    }
  } catch (error) {
    errors.push(error);
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  verified = true;
}

/**
 * Prepare the npm package for release
 *
 * @param {PluginConfig} pluginConfig The plugin configuration.
 * @param {import("semantic-release").PrepareContext & OptionsContext} ctx semantic-release context.
 */
export async function prepare(pluginConfig, ctx) {
  const context = typeContext(ctx);
  const { env, cwd } = context;
  await npmVersion(npmrc, context);

  // ? Can't modify assets configuration in a plugin, so manually add modified `package.json` in git index
  // ? `@semantic-release/git` make release commit with the other assets files after, this is why this plugin should be defined before him
  await add([path.join(typesPath, "package.json")], { cwd, env });

  prepared = true;
}

/**
 * Publish the npm package to the registry
 *
 * @param {PluginConfig} pluginConfig The plugin configuration.
 * @param {import("semantic-release").PublishContext & OptionsContext} ctx semantic-release context.
 */
export async function publish(pluginConfig, ctx) {
  const context = typeContext(ctx);
  if (pluginConfig.npmPublish === false) {
    context.logger.log(
      `Skip publishing to npm registry as npmPublish is false`,
    );
    return false;
  }

  // Reload package.json in case a previous external step updated it
  const pkg = await getPkg(context.cwd);
  if (!verified && pluginConfig.npmPublish !== false && pkg.private !== true) {
    await verifyNpmAuth(npmrc, pkg, context);
  }

  if (!prepared) {
    await prepare(pluginConfig, context);
  }

  return npmPublish(npmrc, pluginConfig, pkg, context);
}

/**
 * Tag npm published version with release channel (eg: `beta`) or `latest` for main releases
 *
 * @param {PluginConfig} pluginConfig The plugin configuration.
 * @param {import("semantic-release").AddChannelContext & OptionsContext} ctx semantic-release context.
 */
export async function addChannel(pluginConfig, ctx) {
  const context = typeContext(ctx);
  // Reload package.json in case a previous external step updated it
  const pkg = await getPkg(context.cwd);
  return npmDistTag(npmrc, pluginConfig, pkg, context);
}
