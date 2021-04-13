const devices = [];

for (let i = 0; i < 50; i++) {
  devices.push({ index: { _id: `DummyTemp-detached-${i}` } });
  devices.push({
    reference: 'detached',
    model: `DummyTemp-${i}`,
    measures: {},
    metadata: {},
    tenantId: null,
    assetId: null
  });
}

const devicesTests = devices.filter(test => test.model);

module.exports = { devices, devicesTests };
