const { Then } = require('cucumber');

Then('an engine on index {string}', async function (index) {
  await this.sdk.query({
    controller: 'device-manager/engines',
    action: 'create',
    index
  });
});
