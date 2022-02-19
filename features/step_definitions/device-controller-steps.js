const { When, Then } = require('cucumber');

const { devicesTests } = require('../fixtures/devices');

When('I succesfully execute {string}:{string} while exeding documentsWriteCount limit', async function (controller, action) {
  const records = [];
  for (let i = 0; i < devicesTests.length; i++) {
    records.push({ deviceId: `DummyTemp-detached-${i}`, engineId: 'tenant-kuzzle' });
  }


  await this.sdk.query({
    controller,
    action,
    body: {
      records
    }
  });
});

Then('All devices in {string} {string} have the property {string} to {string}', async function (index, collection, key, value) {
  const deviceIds = [];
  for (let i = 0; i < devicesTests.length; i++) {
    deviceIds.push(`DummyTemp-detached-${i}`);
  }

  const { successes, errors } = await this.sdk.document.mGet(index, collection, deviceIds);

  if (errors.length > 0) {
    throw new Error(errors);
  }

  for (let i = 0; i < successes.length; i++) {
    const { _source } = successes[i];
    const theValue = value === "null" ? null : value;

    if (_source[key] !== theValue) {
      throw new Error(`engineId should be ${value} but current value is: ${_source.engineId}`);
    }
  }
});

Then('All {string} devices documents exists', async function (tenant) {
  const deviceIds = [];
  for (let i = 0; i < devicesTests.length; i++) {
    deviceIds.push(`DummyTemp-detached-${i}`);
  }

  const { errors } = await this.sdk.document.mGet(tenant, 'devices', deviceIds);

  if (errors.length > 0) {
    throw new Error(errors);
  }
});

Then(/All documents "(.*?)":"(.*?)" (does not)? exists/, async function (index, collection, not) {
  const deviceIds = [];
  for (let i = 0; i < devicesTests.length; i++) {
    deviceIds.push(`DummyTemp-detached-${i}`);
  }

  const { successes, errors } = await this.sdk.document.mGet(index, collection, deviceIds);

  if (not && successes.length > 0) {
    throw new Error(`Documents exists, but it shoudn't`);
  }

  if (!not && errors.length) {
    throw new Error(`Expected documents to exist`);
  }
});
