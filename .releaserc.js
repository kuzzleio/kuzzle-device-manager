const config = require("semantic-release-config-kuzzle");
config.plugins.push([
  "./releaseTypes.mjs",
  { npmPublish: process.env.SEMANTIC_RELEASE_NPM_PUBLISH === "true" },
]);

module.exports = {
  plugins: config.plugins,
  branches: [
    {
      name: "master",
    },
    {
      name: "beta",
      prerelease: true,
    },
  ],
};
