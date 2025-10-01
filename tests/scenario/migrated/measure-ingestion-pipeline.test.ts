import { beforeEachTruncateCollections } from '../../hooks/collections';
import { beforeAllCreateEngines } from '../../hooks/engines';
import { beforeEachLoadFixtures } from '../../hooks/fixtures';

import { useSdk, sendPayloads } from '../../helpers';
import { ApiDeviceLinkAssetsRequest } from 'lib/modules/device';

jest.setTimeout(10000);

describe('features/Measure/IngestionPipeline', () => {
  const sdk = useSdk();

  beforeAll(async () => {
    await sdk.connect();
    await beforeAllCreateEngines(sdk);
  });

  beforeEach(async () => {
    await beforeEachTruncateCollections(sdk);
    await beforeEachLoadFixtures(sdk);
  });

  afterAll(async () => {
    sdk.disconnect();
  });

  it('Enrich a measure for a device linked to an asset with asset info', async () => {
    let response = await sdk.query({
      controller: 'device-manager/devices',
      action: 'create',
      engineId: 'engine-ayse',
      body: { model: 'DummyTemp', reference: 'enrich_me_master' },
    });

    response = await sdk.query<ApiDeviceLinkAssetsRequest>({
      controller: 'device-manager/devices',
      action: 'linkAssets',
      _id: 'DummyTemp-enrich_me_master',
      engineId: 'engine-ayse',
      body: {
        linkedMeasures: [
          {
            assetId: 'Container-unlinked1',
            measureSlots: [{ device: 'temperature', asset: 'temperatureExt' }],
          },
        ],
      },
    });

    response = await sendPayloads(sdk, 'dummy-temp', [
      { deviceEUI: 'enrich_me_master', temperature: 18 },
      { deviceEUI: 'enrich_me_master', temperature: 21 },
    ]);

    await sdk.collection.refresh('engine-ayse', 'measures');

    response = await sdk.query({
      controller: 'document',
      action: 'search',
      index: 'engine-ayse',
      collection: 'measures',
      body: { query: { term: { 'asset._id': 'Container-unlinked1' } } },
    });

    expect(response.result).toMatchObject({
      hits: [
        { _source: { type: 'temperature', values: { temperature: 36 } } },
        { _source: { type: 'temperature', values: { temperature: 42 } } },
      ],
    });
  });

  it('Additional computed measures should be added automatically to the digital twin last measures', async () => {
    let response = await sdk.query({
      controller: 'device-manager/devices',
      action: 'create',
      engineId: 'engine-ayse',
      body: { model: 'DummyTemp', reference: 'compute_me_master' },
    });

    response = await sdk.query<ApiDeviceLinkAssetsRequest>({
      controller: 'device-manager/devices',
      action: 'linkAssets',
      _id: 'DummyTemp-compute_me_master',
      engineId: 'engine-ayse',
      body: {
        linkedMeasures: [
          {
            assetId: 'Container-unlinked1',
            measureSlots: [{ device: 'temperature', asset: 'temperatureExt' }],
          },
        ],
      },
    });

    response = await sendPayloads(sdk, 'dummy-temp', [
      { deviceEUI: 'compute_me_master', temperature: 20 },
    ]);

    await sdk.collection.refresh('engine-ayse', 'measures');

    response = await sdk.query({
      controller: 'document',
      action: 'search',
      index: 'engine-ayse',
      collection: 'measures',
      body: { query: { term: { 'asset.measureName': 'temperatureInt' } } },
    });

    expect(response.result).toMatchObject({
      hits: [{ _source: { origin: { _id: 'compute-temperature-int' } } }],
    });

    const lastMeasuresResponse = await sdk.query({
      controller: 'device-manager/assets',
      action: 'getLastMeasures',
      engineId: 'engine-ayse',
      _id: 'Container-unlinked1',
      measureCount: 2,
    });

    expect(lastMeasuresResponse.result).toMatchObject({
      temperatureExt: { values: { temperature: 20 } },
      temperatureInt: { values: { temperature: 40 } },
    });
  });

  it('Should enrich measure with the origin device metadata', async () => {
    const metadata = { color: 'blue' };

    await sdk.query({
      controller: 'device-manager/devices',
      action: 'create',
      engineId: 'engine-ayse',
      body: { model: 'DummyTemp', reference: 'meta_device', metadata: metadata },
    });

    await sdk.query<ApiDeviceLinkAssetsRequest>({
      controller: 'device-manager/devices',
      action: 'linkAssets',
      _id: 'DummyTemp-meta_device',
      engineId: 'engine-ayse',
      body: {
        linkedMeasures: [
          {
            assetId: 'Container-unlinked1',
            measureSlots: [{ device: 'temperature', asset: 'temperatureExt' }],
          },
        ],
      },
    });

    await sendPayloads(sdk, 'dummy-temp', [
      { deviceEUI: 'meta_device', temperature: 35 },
      { deviceEUI: 'meta_device', temperature: 25 },
    ]);

    await sdk.collection.refresh('engine-ayse', 'measures');

    const response = await sdk.query({
      controller: 'document',
      action: 'search',
      index: 'engine-ayse',
      collection: 'measures',
      body: { query: { term: { 'asset._id': 'Container-unlinked1' } } },
    });

    expect(response.result).toMatchObject({
      hits: [
        {
          _source: {
            type: 'temperature',
            values: { temperature: 35 },
            origin: { deviceMetadata: metadata },
          },
        },
        {
          _source: {
            type: 'temperature',
            values: { temperature: 25 },
            origin: { deviceMetadata: metadata },
          },
        },
      ],
    });
  });

  it('Should enrich measure with the origin device groups', async () => {
    await sendPayloads(sdk, 'dummy-temp-position', [
      { deviceEUI: 'linked2', temperature: 35, location: { lon: 12, lat: 12 } },
    ]);

    await sdk.collection.refresh('engine-ayse', 'measures');

    const response = await sdk.query({
      controller: 'document',
      action: 'search',
      index: 'engine-ayse',
      collection: 'measures',
      body: { query: { term: { 'origin.reference': 'linked2' } } },
    });

    expect(response.result.hits[0]._source.origin.groups[0]).toMatchObject({
      path: 'test-parent-asset',
    });
  });
});
