const sensors = [];
for (let i = 0; i < 50; i++) {
  sensors.push({ index: { _id: `DummyTemp_detached-${i}` } });
  sensors.push({
    reference: 'detached',
    model: `DummyTemp-${i}`,
    measures: {},
    metadata: {},
    tenantId: null,
    assetId: null
  });
}

const sensorsTests = sensors.filter(test => test.model);

module.exports = { sensors, sensorsTests };
