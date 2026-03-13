module.exports = {
  extends: ["semantic-release-config-kuzzle"],
  branches: [
    { name: "2-stable" },
    { name: "2-beta", prerelease: true },
    { name: "2-dev", prerelease: "dev" },
    { name: "3-dev", prerelease: true },
  ],
};
