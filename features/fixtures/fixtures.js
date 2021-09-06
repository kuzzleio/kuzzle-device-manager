const { devices } = require('./devices');

module.exports = {
  'device-manager': {
    devices: [
      ...devices,
      { index: { _id: 'DummyTemp-detached' } },
      {
        reference: 'detached',
        model: 'DummyTemp',
        measures: {
          position: {
            updatedAt: 1610793427950,
            payloadUuid: 'some-uuid',
            point: {
              lat: 43.610767,
              lon: 3.876716,
            },
            accuracy: 42,
          }
        },
        metadata: {},
        tenantId: null,
        assetId: null
      },
      { index: { _id: 'DummyTemp-attached_ayse_unlinked' } },
      {
        reference: 'attached_ayse_unlinked',
        model: 'DummyTemp',
        measures: {
          temperature: {
            updatedAt: 1610793427950,
            payloadUuid: 'some-uuid',
            degree: 23.3,
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
    devices: [
      { index: { _id: 'DummyTemp-attached_ayse_unlinked' } },
      {
        reference: 'attached_ayse_unlinked',
        model: 'DummyTemp',
        measures: {
          temperature: {
            updatedAt: 1610793427950,
            payloadUuid: 'some-uuid',
            degree: 23.3,
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
