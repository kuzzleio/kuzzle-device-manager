const { devices } = require('./devices');

const dummyTempAttachedAyseUnLinked = {
  reference: 'attached_ayse_unlinked',
  model: 'DummyTemp',
  measures: [
    {
      type: 'temperature',
      name: 'temperature',
      unit: {
        name: 'Degree',
        sign: '°',
        type: 'number',
      },
      values: {
        temperature: 23.3,
      },
      measuredAt: 1610793427950,
      origin: {
        id: 'DummyTemp.attached_ayse_unlinked',
        type: 'device',
        model: 'DummyTemp',
        reference: 'attached_ayse_unlinked',
        payloadUuids: ['some-uuid'],
      }
    },
    {
      type: 'battery',
      name: 'battery',
      unit: {
        name: 'Volt',
        sign: 'v',
        type: 'number',
      },
      values: {
        battery: 80,
      },
      measuredAt: 1610793427950,
      origin: {
        id: 'DummyTemp.attached_ayse_unlinked',
        type: 'device',
        model: 'DummyTemp',
        reference: 'attached_ayse_unlinked',
        payloadUuids: ['some-uuid'],
      }
    }
  ],
  engineId: 'tenant-ayse',
  assetId: null
};

const measuresAttachedAyseLinked = [
  {
    type: 'temperature',
    name: 'temperature',
    unit: {
      name: 'Degree',
      sign: '°',
      type: 'number',
    },
    values: {
      temperature: 42.2,
    },
    measuredAt: 1610793427950,
    origin: {
      id: 'DummyTemp.attached_ayse_linked',
      type: 'device',
      model: 'DummyTemp',
      reference: 'attached_ayse_linked',
      payloadUuids: ['some-uuid'],
    }
  },
  {
    type: 'battery',
    name: 'battery',
    unit: {
      name: 'Volt',
      sign: 'v',
      type: 'number',
    },
    values: {
      battery: 80,
    },
    measuredAt: 1610793427950,
    origin: {
      id: 'DummyTemp.attached_ayse_linked',
      type: 'device',
      model: 'DummyTemp',
      reference: 'attached_ayse_linked',
      payloadUuids: ['some-uuid'],
    }
  }
];

const dummyTempAttachedAyseLinked = {
  reference: 'attached_ayse_linked',
  model: 'DummyTemp',
  measures: measuresAttachedAyseLinked,
  engineId: 'tenant-ayse',
  assetId: 'tools.MART.linked'
};

module.exports = {
  'device-manager': {
    devices: [
      // ...devices,
      { index: { _id: 'DummyTemp.detached' } },
      {
        reference: 'detached',
        model: 'DummyTemp',
        measures: [
          {
            type: 'position',
            name: 'position',
            unit: {
              name: 'GPS',
              sign: null,
              type: 'geo_point',
            },
            values: {
              position: {
                lat: 43.610767,
                lon: 3.876716,
              },
              accuracy: 42,
            },
            measuredAt: 1610793427950,
            origin: {
              id: 'DummyTemp.detached',
              type: 'device',
              model: 'DummyTemp',
              reference: 'detached',
              payloadUuids: ['some-uuid'],
            }
          }
        ],
        metadata: {},
        engineId: null,
        assetId: null
      },
      { index: { _id: 'DummyTemp.attached_ayse_unlinked' } },
      dummyTempAttachedAyseUnLinked,
      { index: { _id: 'DummyTemp.attached_ayse_linked' } },
      dummyTempAttachedAyseLinked,
    ]
  },
  'tenant-ayse': {
    devices: [
      { index: { _id: 'DummyTemp.attached_ayse_unlinked' } },
      dummyTempAttachedAyseUnLinked,
      { index: { _id: 'DummyTemp.attached_ayse_linked' } },
      dummyTempAttachedAyseLinked,
    ],
    assets: [
      { index: { _id: 'tools.PERFO.unlinked' } },
      {
        type: 'tools',
        model: 'PERFO',
        reference: 'unlinked',
        measures: {},
      },
      { index: { _id: 'tools.SCREW.unlinked' } },
      {
        type: 'tools',
        model: 'SCREW',
        reference: 'unlinked',
        measures: {},
      },
      { index: { _id: 'tools.MART.linked' } },
      {
        type: 'tools',
        model: 'MART',
        reference: 'linked',
        measures: measuresAttachedAyseLinked,
      }
    ]
  },
};
