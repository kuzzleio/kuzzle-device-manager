const config = require("semantic-release-config-kuzzle");

// ? Plugins are trigger in the order of definition, so ensure `releaseTypes.mjs` is inserted before `@semantic-release/git`
config.plugins.splice(config.plugins.indexOf("@semantic-release/git"), 0, [
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