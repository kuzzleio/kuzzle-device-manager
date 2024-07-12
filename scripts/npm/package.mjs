import { readPackage } from 'read-pkg';
import { execa } from 'execa';
import semver from 'semver';
import normalizeUrl from 'normalize-url';
import AggregateError from 'aggregate-error';
import { getError } from './error.mjs';
import { getRegistry } from './registry.mjs';

/**
 * @typedef {import("./types").PluginConfig} PluginConfig
 */
/**
 * @typedef {import("./types").ReleaseInfo} ReleaseInfo
 */

/**
 * Get package.json content.
 *
 * @param {string} pkgPath package.json package.
 *
 * @returns {Promise<import('read-pkg').PackageJson>} parsed package.json content.
 */
export async function getPkg(pkgPath) {
  try {
    const pkg = await readPackage({ cwd: pkgPath });

    if (!pkg.name) {
      throw getError('ENOPKGNAME');
    }

    return pkg;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw getError('ENOPKG');
    }

    throw error;
  }
}

/**
 * Get validated and normalized channel.
 *
 * @param {string} channel channel name.
 *
 * @returns {string}
 */
export function getChannel(channel) {
  // eslint-disable-next-line no-nested-ternary
  return channel ? (semver.validRange(channel) ? `release-${channel}` : channel) : 'latest';
}

/**
 * Format release info.
 *
 * @param {import('read-pkg').PackageJson} pkg package.json content.
 * @param {import('semantic-release').AddChannelContext} context semantic-release context.
 * @param {string} distTag distribution tag.
 * @param {string} [registry] registry URL.
 *
 * @returns {ReleaseInfo}
 */
export function getReleaseInfo(
  { name },
  { env: { DEFAULT_NPM_REGISTRY = 'https://registry.npmjs.org/' }, nextRelease: { version } },
  distTag,
  registry,
) {
  return {
    channel: distTag,
    name: `npm package (@${distTag} dist-tag)`,
    url:
      registry && normalizeUrl(registry) === normalizeUrl(DEFAULT_NPM_REGISTRY)
        ? `https://www.npmjs.com/package/${name}/v/${version}`
        : undefined,
  };
}

/**
 * Add distribution tag to release the package.
 *
 * @param {string} npmrc npmrc path.
 * @param {PluginConfig} pluginConfig The plugin configuration.
 * @param {import('semantic-release').AddChannelContext} context semantic-release context.
 *
 * @returns {Promise<ReleaseInfo | false>}
 */
export async function npmDistTag(npmrc, pluginConfig, pkg, context) {
  const {
    cwd,
    env,
    stdout,
    stderr,
    nextRelease: { version, channel },
    logger,
  } = context;

  if (pluginConfig.npmPublish === false || pkg.private === true) {
    logger.log(
      `Skip adding to npm channel as ${pluginConfig.npmPublish === false ? 'npmPublish' : "package.json's private property"} is ${
        pluginConfig.npmPublish !== false
      }`,
    );
    return false;
  }
  const registry = getRegistry(pkg, context);
  const distTag = getChannel(channel);

  logger.log(`Adding version ${version} to npm registry on dist-tag ${distTag}`);

  const result = execa(
    'npm',
    [
      'dist-tag',
      'add',
      `${pkg.name}@${version}`,
      distTag,
      '--userconfig',
      npmrc,
      '--registry',
      registry,
    ],
    {
      cwd,
      env,
      preferLocal: true,
    },
  );
  result.stdout.pipe(stdout, { end: false });
  result.stderr.pipe(stderr, { end: false });
  await result;

  logger.log(`Added ${pkg.name}@${version} to dist-tag @${distTag} on ${registry}`);

  return getReleaseInfo(pkg, context, distTag, registry);
}

/**
 * Update NPM package version.
 *
 * @param {string} npmrc npmrc path.
 * @param {import('semantic-release').PrepareContext} context semantic-release context.
 *
 * @returns {Promise<void>}
 */
export async function npmVersion(
  npmrc,
  { cwd, env, stdout, stderr, nextRelease: { version }, logger },
) {
  logger.log('Write version %s to package.json in %s', version, cwd);

  const versionResult = execa(
    'npm',
    ['version', version, '--userconfig', npmrc, '--no-git-tag-version', '--allow-same-version'],
    {
      cwd,
      env,
      preferLocal: true,
    },
  );
  versionResult.stdout.pipe(stdout, { end: false });
  versionResult.stderr.pipe(stderr, { end: false });

  await versionResult;
}

/**
 * Publish NPM package to registry.
 *
 * @param {string} npmrc npmrc path.
 * @param {PluginConfig} pluginConfig The plugin configuration.
 * @param {import('read-pkg').PackageJson} pkg package.json content.
 * @param {import('semantic-release').PublishContext} context semantic-release context.
 *
 * @returns {Promise<ReleaseInfo | false>}
 */
export async function npmPublish(npmrc, pluginConfig, pkg, context) {
  const {
    cwd,
    env,
    stdout,
    stderr,
    nextRelease: { version, channel },
    logger,
  } = context;

  if (pluginConfig.npmPublish === false || pkg.private === true) {
    logger.log(
      `Skip publishing to npm registry as ${pluginConfig.npmPublish === false ? 'npmPublish' : "package.json's private property"} is ${
        pluginConfig.npmPublish !== false
      }`,
    );
    return false;
  }

  const registry = getRegistry(pkg, context);
  const distTag = getChannel(channel);

  logger.log(`Publishing version ${version} to npm registry on dist-tag ${distTag}`);

  const result = execa(
    'npm',
    ['publish', '--userconfig', npmrc, '--tag', distTag, '--registry', registry],
    { cwd, env, preferLocal: true },
  );
  result.stdout.pipe(stdout, { end: false });
  result.stderr.pipe(stderr, { end: false });

  await result;

  logger.log(`Published ${pkg.name}@${version} to dist-tag @${distTag} on ${registry}`);

  return getReleaseInfo(pkg, context, distTag, registry);
}
