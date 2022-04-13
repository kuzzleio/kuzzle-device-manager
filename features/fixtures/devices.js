const devices = [];

for (let i = 0; i < 50; i++) {
  devices.push({ index: { _id: `DummyTemp-detached-${i}` } });
  devices.push({
    reference: `detached-${i}`,
    model: 'DummyTemp',
    measures: [],
    metadata: {},
    engineId: null,
    assetId: null
  });
}

const devicesTests = devices.filter(test => test.model);

module.exports = { devices, devicesTests };
