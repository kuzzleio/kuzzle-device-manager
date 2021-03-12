const { When, Then } = require('cucumber');

const { sensorsTests } = require('../fixtures/sensors');

When('I succesfully execute {string}:{string} while exeding documentsWriteCount limit', async function (controller, action) {
  const records = [];
  for (let i = 0; i < sensorsTests.length; i++) {
    records.push({ sensorId: `DummyTemp_detached-${i}`, tenantId: 'tenant-kuzzle' });
  }


  await this.sdk.query({
    controller,
    action,
    body: {
      records
    }
  });
});

Then('All sensors in {string} {string} have the property {string} to {string}', async function (index, collection, key, value) {
  const sensorIds = [];
  for (let i = 0; i < sensorsTests.length; i++) {
    sensorIds.push(`DummyTemp_detached-${i}`);
  }

  const { successes, errors } = await this.sdk.document.mGet(index, collection, sensorIds);

  if (errors.length > 0) {
    throw new Error(errors);
  }

  for (let i = 0; i < successes.length; i++) {
    const { _source } = successes[i];
    const theValue = value === "null" ? null : value;

    if (_source[key] !== theValue) {
      throw new Error(`tenantId should be ${value} but current value is: ${_source.tenantId}`);
    }
  }
});

Then('All {string} sensors documents exists', async function (tenant) {
  const sensorIds = [];
  for (let i = 0; i < sensorsTests.length; i++) {
    sensorIds.push(`DummyTemp_detached-${i}`);
  }

  const { errors } = await this.sdk.document.mGet(tenant, 'sensors', sensorIds);

  if (errors.length > 0) {
    throw new Error(errors);
  }
});

Then(/All documents "(.*?)":"(.*?)" (does not)? exists/, async function (index, collection, not) {
  const sensorIds = [];
  for (let i = 0; i < sensorsTests.length; i++) {
    sensorIds.push(`DummyTemp_detached-${i}`);
  }

  const { successes, errors } = await this.sdk.document.mGet(index, collection, sensorIds);

  if (not && successes.length > 0) {
    throw new Error(`Documents exists, but it shoudn't`);
  }

  if (!not && errors.length) {
    throw new Error(`Expected documents to exist`);
  }
});
