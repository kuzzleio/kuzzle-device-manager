import path from 'node:path';
import fs from 'node:fs/promises';
import getRegistryUrl from 'registry-auth-token/registry-url.js';
import getAuthToken from 'registry-auth-token';
import nerfDart from 'nerf-dart';
import { execa } from 'execa';
import rc from 'rc';
import AggregateError from 'aggregate-error';
import { getError } from './error.mjs';

/**
 *
 * @param {{ cwd: string, env: Record<string, string> }} context
 *
 * @returns {ReturnType<import('rc')>}
 */
function readRC({ cwd, env }) {
  const NPM_CONFIG_USERCONFIG = env.NPM_CONFIG_USERCONFIG ?? env.npm_config_userconfig;
  return rc(
    'npm',
    { registry: 'https://registry.npmjs.org/' },
    { config: NPM_CONFIG_USERCONFIG || path.resolve(cwd, '.npmrc') },
  );
}

/**
 * Get NPM registry
 *
 * @param {import('read-pkg').PackageJson} pkg package.json content
 * @param {import('semantic-release').VerifyConditionsContext} context process context
 * @returns {String} registry URL
 */
export function getRegistry({ publishConfig: { registry } = {}, name }, context) {
  return (
    registry ||
    context.env.NPM_CONFIG_REGISTRY ||
    getRegistryUrl(name.split('/')[0], readRC(context))
  );
}

/**
 * Set npmrc auth
 *
 * @param {string} npmrc npmrc path
 * @param {import('read-pkg').PackageJson} pkg package.json content
 * @param {import('semantic-release').VerifyConditionsContext} context process context
 */
export async function setNpmrcAuth(npmrc, registry, context) {
  const {
    env: { NPM_TOKEN },
    logger,
  } = context;

  logger.log('Verify authentication for registry %s', registry);
  const { configs, ...rcConfig } = readRC(context);

  if (configs) {
    logger.log('Reading npm config from %s', configs.join(', '));
  }

  const currentConfig = configs
    ? (await Promise.all(configs.map((config) => fs.readFile(config)))).join('\n')
    : '';

  if (getAuthToken(registry, { npmrc: rcConfig })) {
    await fs.writeFile(npmrc, currentConfig);
    return;
  }

  if (NPM_TOKEN) {
    await fs.writeFile(
      npmrc,
      `${currentConfig ? `${currentConfig}\n` : ''}${nerfDart(registry)}:_authToken = \${NPM_TOKEN}`,
    );
    logger.log(`Wrote NPM_TOKEN to ${npmrc}`);
  } else {
    throw getError('ENONPMTOKEN', { registry });
  }
}

/**
 *
 * @param {string} npmrc npmrc path
 * @param {import('read-pkg').PackageJson} pkg package.json content
 * @param {import('semantic-release').VerifyConditionsContext} context process context
 */
export async function verifyNpmAuth(npmrc, pkg, context) {
  const {
    cwd,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    env: { DEFAULT_NPM_REGISTRY = 'https://registry.npmjs.org/', ...env },
    stdout,
    stderr,
  } = context;
  const registry = getRegistry(pkg, context);

  await setNpmrcAuth(npmrc, registry, context);

  try {
    const whoamiResult = execa('npm', ['whoami', '--userconfig', npmrc, '--registry', registry], {
      cwd,
      env,
      preferLocal: true,
    });
    whoamiResult.stdout.pipe(stdout, { end: false });
    whoamiResult.stderr.pipe(stderr, { end: false });
    await whoamiResult;
  } catch {
    throw getError('EINVALIDNPMTOKEN', { registry });
  }
}
