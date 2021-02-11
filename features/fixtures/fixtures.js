module.exports = {
  'device-manager': {
    sensors: [
      { index: { _id: 'DummyTemp_detached' } },
      {
        reference: 'detached',
        model: 'DummyTemp',
        measures: {},
        metadata: {},
        tenantId: null,
        assetId: null
      },
      { index: { _id: 'DummyTemp_attached-ayse-unlinked' } },
      {
        reference: 'attached-ayse-unlinked',
        model: 'DummyTemp',
        measures: {
          temperature: {
            updatedAt: 1610793427950,
            payloadUuid: 'some-uuid',
            value: 23.3,
          }
        },
        qos: {
          battery: 80
        },
        tenantId: 'tenant-ayse',
        assetId: null
      },
    ]
  },
  'tenant-ayse': {
    sensors: [
      { index: { _id: 'DummyTemp_attached-ayse-unlinked' } },
      {
        reference: 'attached-ayse-unlinked',
        model: 'DummyTemp',
        measures: {
          temperature: {
            updatedAt: 1610793427950,
            payloadUuid: 'some-uuid',
            value: 23.3,
          }
        },
        qos: {
          battery: 80
        },
        tenantId: 'tenant-ayse',
        assetId: null
      },
    ],
    assets: [
      { index: { _id: 'PERFO-unlinked' } },
      {
        model: 'PERFO',
        reference: 'unlinked',
        measures: {},
      }
    ]
  },
}
