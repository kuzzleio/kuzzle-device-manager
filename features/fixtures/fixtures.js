const dummyTempAttachedAyseUnLinked = {
  reference: 'attached_ayse_unlinked',
  model: 'DummyTemp',
  measures: [
    {
      type: 'temperature',
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
        id: 'DummyTemp-attached_ayse_unlinked',
        type: 'device',
        model: 'DummyTemp',
        payloadUuids: ['some-uuid'],
      }
    },
    {
      type: 'battery',
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
        id: 'DummyTemp-attached_ayse_unlinked',
        type: 'device',
        model: 'DummyTemp',
        payloadUuids: ['some-uuid'],
      }
    }
  ],
  engineId: 'engine-ayse',
  assetId: null
};

const dummyTempAttachedAyseUnLinked2 = {
  reference: 'attached_ayse_unlinked_2',
  model: 'DummyTemp',
  measures: [
    {
      type: 'temperature',
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
        id: 'DummyTemp-attached_ayse_unlinked_2',
        type: 'device',
        model: 'DummyTemp',
        payloadUuids: ['some-uuid'],
      }
    },
    {
      type: 'battery',
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
        id: 'DummyTemp-attached_ayse_unlinked_2',
        type: 'device',
        model: 'DummyTemp',
        payloadUuids: ['some-uuid'],
      }
    }
  ],
  engineId: 'engine-ayse',
  assetId: null
};

const measuresAttachedAyseLinked = [
  {
    type: 'temperature',
    /* A measure of the device `DummyTemp-attached_ayse_linked` */
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
      id: 'DummyTemp-attached_ayse_linked',
      type: 'device',
      model: 'DummyTemp',
      payloadUuids: ['some-uuid'],
      assetId: 'tools-MART-linked',
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
      id: 'DummyTemp-attached_ayse_linked',
      type: 'device',
      model: 'DummyTemp',
      payloadUuids: ['some-uuid'],
      assetId: 'tools-MART-linked',
    }
  }
];

const dummyTempAttachedAyseLinked = {
  reference: 'attached_ayse_linked',
  model: 'DummyTemp',
  measures: measuresAttachedAyseLinked,
  engineId: 'engine-ayse',
  assetId: 'tools-MART-linked'
};

const truckCategory = 
  {
    'name': 'truck',
    'assetMetadata': [],
    'metadataValues': []
  };

const bigTruckCategory = {
  'name': 'bigTruck',
  'parent': 'truck'
};

const sizeMetadata = {
  'name': 'size',
  'valueType': 'integer',
  'mandatory': false,
};

module.exports = {
  'device-manager': {
    devices: [
      // ...devices,
      { index: { _id: 'DummyTemp-detached' } },
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
              id: 'DummyTemp-detached',
              type: 'device',
              model: 'DummyTemp',
              payloadUuids: ['some-uuid'],
            }
          }
        ],
        metadata: {},
        engineId: null,
        assetId: null
      },
      { index: { _id: 'DummyTemp-attached_ayse_unlinked' } },
      dummyTempAttachedAyseUnLinked,
      { index: { _id: 'DummyTemp-attached_ayse_unlinked_2' } },
      dummyTempAttachedAyseUnLinked2,
      { index: { _id: 'DummyTemp-attached_ayse_linked' } },
      dummyTempAttachedAyseLinked,
    ]
  },
  'engine-ayse': {
    devices: [
      { index: { _id: 'DummyTemp-attached_ayse_unlinked' } },
      dummyTempAttachedAyseUnLinked,
      { index: { _id: 'DummyTemp-attached_ayse_unlinked_2' } },
      dummyTempAttachedAyseUnLinked2,
      { index: { _id: 'DummyTemp-attached_ayse_linked' } },
      dummyTempAttachedAyseLinked,
    ],
    'asset-category': [
      { index: { _id: 'truck' } },
      truckCategory,
      { index: { _id: 'bigTruck' } },
      bigTruckCategory,
    ],
    metadata: [
      { index: { _id: 'size' } },
      sizeMetadata,
    ],
    assets: [
      { index: { _id: 'tools-PERFO-unlinked' } },
      {
        type: 'tools',
        model: 'PERFO',
        reference: 'unlinked',
        measures: [],
        deviceLinks: [],
      },
      { index: { _id: 'tools-SCREW-unlinked' } },
      {
        type: 'tools',
        model: 'SCREW',
        reference: 'unlinked',
        measures: [],
        deviceLinks: [],
      },
      { index: { _id: 'tools-MART-linked' } },
      {
        type: 'tools',
        model: 'MART',
        reference: 'linked',
        measures: measuresAttachedAyseLinked,
        deviceLinks: [],
      }
    ]
  },
};
