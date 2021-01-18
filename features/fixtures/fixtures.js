module.exports = {
  'device-manager': {
    sensors: [
      { index: { _id: 'DummyTemp/unassigned' } },
      {
        reference: 'unassigned',
        model: 'DummyTemp',
        measures: {},
        metadata: {},
        tenantId: null,
        assetId: null
      },
      { index: { _id: 'DummyTemp/assigned-ayse-unlinked' } },
      {
        reference: 'assigned-ayse-unlinked',
        model: 'DummyTemp',
        measures: {
          temperature: {
            updatedAt: 1610793427950,
            payloadUuid: 'some-uuid',
            value: 23.3,
          }
        },
        metadata: {
          battery: 80
        },
        tenantId: 'tenant-ayse',
        assetId: null
      },
    ]
  },
  'tenant-ayse': {
    sensors: [
      { index: { _id: 'DummyTemp/assigned-ayse-unlinked' } },
      {
        reference: 'assigned-ayse-unlinked',
        model: 'DummyTemp',
        measures: {
          temperature: {
            updatedAt: 1610793427950,
            payloadUuid: 'some-uuid',
            value: 23.3,
          }
        },
        metadata: {
          battery: 80
        },
        tenantId: 'tenant-ayse',
        assetId: null
      },
    ],
    assets: [
      { index: { _id: 'PERFO/unlinked' } },
      {
        model: 'PERFO',
        reference: 'unlinked',
        measures: {},
      }
    ]
  },
}