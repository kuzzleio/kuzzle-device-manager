import path from "node:path";
import AggregateError from "aggregate-error";
import { temporaryFile } from "tempy";
import SemanticReleaseError from "@semantic-release/error";
import verifyNpmConfig from "@semantic-release/npm/lib/verify-config.js";
import getPkg from "@semantic-release/npm/lib/get-pkg.js";
import verifyNpmAuth from "@semantic-release/npm/lib/verify-auth.js";
import addChannelNpm from "@semantic-release/npm/lib/add-channel.js";
import prepareNpm from "@semantic-release/npm/lib/prepare.js";
import publishNpm from "@semantic-release/npm/lib/publish.js";
import { add } from "@semantic-release/git/lib/git.js";

/**
 * @typedef {Object} OptionsContext
 * @prop {import("semantic-release").GlobalConfig} options
 */

/**
 * @typedef {Object} PluginConfig
 * @prop {boolean} [npmPublish] Define if the package should be published on npm repository.
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
 * Verify the npm configuration and plugin setup:
 * - The plugin should be define before the plugin `@semantic-release/git` if it's defined.
 *
 * @param {PluginConfig} pluginConfig The plugin configuration.
 * @param {import("semantic-release").VerifyConditionsContext & OptionsContext} ctx semantic-release context.
 */
export async function verifyConditions(pluginConfig, ctx) {
  const context = typeContext(ctx);
  const errors = verifyNpmConfig(pluginConfig);

  const pluginsList = context.options.plugins.map((plugin) =>
    Array.isArray(plugin) ? plugin[0] : plugin
  );
  const gitPluginIndex = pluginsList.indexOf("@semantic-release/git");

  if (gitPluginIndex !== -1) {
    const pluginIndex = pluginsList.findIndex((plugin) =>
      plugin.includes(path.basename(import.meta.url))
    );
    if (pluginIndex > gitPluginIndex) {
      errors.push(
        new SemanticReleaseError(
          "This plugin should be defined before plugin `@semantic-release/git`",
          "EINVALIDSETUP"
        )
      );
    }
  }

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

/**
 * Prepare the npm package for release
 *
 * @param {PluginConfig} pluginConfig The plugin configuration.
 * @param {import("semantic-release").PrepareContext & OptionsContext} ctx semantic-release context.
 */
export async function prepare(pluginConfig, ctx) {
  const context = typeContext(ctx);
  const { env, cwd } = context;
  await prepareNpm(npmrc, pluginConfig, context);

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

  return publishNpm(npmrc, pluginConfig, pkg, context);
}

/**
 * Tag npm published version with release channel (eg: `beta`) or `latest` for main releases
 *
 * @param {PluginConfig} pluginConfig The plugin configuration.
 * @param {import("semantic-release").AddChannelContext & OptionsContext} ctx semantic-release context.
 */
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
