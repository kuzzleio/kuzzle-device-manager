const { When, Then } = require('cucumber');

When('I attach multiple devices while exeding documentsWriteCount limit', async function () {
  const records = [];
  for (let i = 0; i < 50; i++) {
    records.push({ deviceId: `DummyTemp_detached-${i}`, tenantId: 'tenant-kuzzle' });
  }


  await this.sdk.query({
    controller: "device-manager/device",
    action: "mAttach",
    body: {
      records
    }
  });
});

Then('All attached devices have the correct tenantId', async function () {
  const deviceIds = [];
  for (let i = 0; i < 50; i++) {
    deviceIds.push(`DummyTemp_detached-${i}`);
  }

  const { successes, errors } = await this.sdk.document.mGet('device-manager', 'devices', deviceIds);

  if (errors.length > 0) {
    throw new Error(errors);
  }

  for (let i = 0; i < successes.length; i++) {
    const { _source } = successes[i];
    if (_source.tenantId !== 'tenant-kuzzle') {
      throw new Error('tenantId should be tenant-kuzzle but current value is: ', _source.tenantId);
    }
  }
});


Then('All tenant devices documents exists', async function () {
  const deviceIds = [];
  for (let i = 0; i < 50; i++) {
    deviceIds.push(`DummyTemp_detached-${i}`);
  }

  const { errors } = await this.sdk.document.mGet('tenant-kuzzle', 'devices', deviceIds);

  if (errors.length > 0) {
    throw new Error(errors);
  }
});
