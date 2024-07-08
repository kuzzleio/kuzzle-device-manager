/* eslint-disable sort-keys */
import SemanticReleaseError from '@semantic-release/error';

export const ERROR_DEFINITIONS = {
  EINVALIDNPMPUBLISH({ npmPublish }) {
    return {
      message: 'Invalid `npmPublish` option.',
      details: `If the npmPublish option defined, must be a \`Boolean\`.

Your configuration for the \`npmPublish\` option is \`${npmPublish}\`.`,
    };
  },
  ENONPMTOKEN({ registry }) {
    return {
      message: 'No npm token specified.',
      details: `An npm token must be created and set in the \`NPM_TOKEN\` environment variable on your CI environment.

Please make sure to create an [npm token](https://docs.npmjs.com/getting-started/working_with_tokens#how-to-create-new-tokens) and to set it in the \`NPM_TOKEN\` environment variable on your CI environment. The token must allow to publish to the registry \`${registry}\`.`,
    };
  },
  EINVALIDNPMTOKEN({ registry }) {
    return {
      message: 'Invalid npm token.',
      details: `The npm token configured in the \`NPM_TOKEN\` environment variable must be a valid [token](https://docs.npmjs.com/getting-started/working_with_tokens) allowing to publish to the registry \`${registry}\`.

  If you are using Two Factor Authentication for your account, set its level to ["Authorization only"](https://docs.npmjs.com/getting-started/using-two-factor-authentication#levels-of-authentication) in your account settings. **semantic-release** cannot publish with the default "
  Authorization and writes" level.

Please make sure to set the \`NPM_TOKEN\` environment variable in your CI with the exact value of the npm token.`,
    };
  },
  ENOPKGNAME() {
    return {
      message: 'Missing `name` property in `package.json`.',
      details: `The \`package.json\`'s [name](https://docs.npmjs.com/files/package.json#name) property is required in order to publish a package to the npm registry.

Please make sure to add a valid \`name\` for your package in your \`package.json\`.`,
    };
  },
  ENOPKG() {
    return {
      message: 'Missing `package.json` file.',
      details: `A [package.json file](https://docs.npmjs.com/files/package.json) at the root of your project is required to release on npm.

Please follow the [npm guideline](https://docs.npmjs.com/getting-started/creating-node-modules) to create a valid \`package.json\` file.`,
    };
  },
};

export function getError(code, ctx = {}) {
  const { message, details } = ERROR_DEFINITIONS[code](ctx);

  return new SemanticReleaseError(message, code, details);
}
