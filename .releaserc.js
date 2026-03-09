module.exports = {
  extends: ['semantic-release-config-kuzzle'],
  branches: [
    { name: 'master' },
    { name: 'beta', prerelease: true },
    { name: '2-dev', prerelease: 'dev' },
    { name: 'next', prerelease: true },
  ],
};
