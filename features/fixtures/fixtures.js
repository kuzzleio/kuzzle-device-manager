module.exports = {
  'device-manager': {
    sensors: [
      { index: { _id: 'DummyTemp/unassigned' } },
      {
        manufacturerId: 'unassigned',
        model: 'DummyTemp',
        measures: {},
        metadata: {},
        tenantId: null,
        assetId: null
      },
      { index: { _id: 'DummyTemp/assigned-panja-unlinked' } },
      {
        manufacturerId: 'assigned-panja-unlinked',
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
        tenantId: 'tenant-panja',
        assetId: null
      },
    ]
  },
  'tenant-panja': {
    sensors: [
      { index: { _id: 'DummyTemp/assigned-panja-unlinked' } },
      {
        manufacturerId: 'assigned-panja-unlinked',
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
        tenantId: 'tenant-panja',
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