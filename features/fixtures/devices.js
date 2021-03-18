const devices = [];

for (let i = 0; i < 50; i++) {
  devices.push({ index: { _id: `DummyTemp_detached-${i}` } });
  devices.push({
    reference: 'detached',
    model: `DummyTemp-${i}`,
    measures: {},
    metadata: {},
    tenantId: null,
    assetId: null
  });
}

module.exports = devices;
