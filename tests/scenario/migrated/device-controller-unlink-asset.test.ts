import { beforeEachTruncateCollections } from '../../hooks/collections';
import { beforeAllCreateEngines } from '../../hooks/engines';
import { beforeEachLoadFixtures } from '../../hooks/fixtures';

import { useSdk, sendPayloads } from '../../helpers';
import { ApiDeviceUnlinkAssetsRequest } from 'lib/modules/device';

jest.setTimeout(10000);

describe('features/Device/Controller/UnlinkAssets', () => {
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

  it('Unlink the asset', async () => {
    let response;
    let promise;

    response = await sdk.query<ApiDeviceUnlinkAssetsRequest>({
      controller: 'device-manager/devices',
      action: 'unlinkAssets',
      engineId: 'engine-ayse',
      _id: 'DummyTemp-linked1',
      body: {
        linkedMeasures: [
          {
            assetId: 'Container-linked1',
            allMeasures: true,
          },
        ],
      },
    });

    await expect(
      sdk.document.get('engine-ayse', 'devices', 'DummyTemp-linked1'),
    ).resolves.toMatchObject({
      _source: { linkedMeasures: [] },
    });

    await expect(
      sdk.document.get('engine-ayse', 'assets', 'Container-linked1'),
    ).resolves.toMatchObject({
      _source: { linkedMeasures: [] },
    });
  });

  it('Error when the device was not linked', async () => {
    let response;
    let promise;

    promise = sdk.query<ApiDeviceUnlinkAssetsRequest>({
      controller: 'device-manager/devices',
      action: 'unlinkAssets',
      _id: 'DummyTemp-unlinked1',
      body: {
        linkedMeasures: [
          {
            assetId: 'Container-linked1',
            allMeasures: true,
          },
        ],
      },
      engineId: 'engine-ayse',
    });

    await expect(promise).rejects.toMatchObject({
      message: 'Device "DummyTemp-unlinked1" is not linked to an asset.',
    });
  });

  it('Unlink asset when deleting device', async () => {
    let response;
    let promise;

    response = await sdk.query({
      controller: 'device-manager/devices',
      action: 'delete',
      engineId: 'engine-ayse',
      _id: 'DummyTemp-linked1',
    });

    await expect(
      sdk.document.get('engine-ayse', 'assets', 'Container-linked1'),
    ).resolves.toMatchObject({
      _source: { linkedMeasures: { length: 0 } },
    });

    await sdk.collection.refresh('engine-ayse', 'assets-history');

    response = await sdk.query({
      controller: 'document',
      action: 'search',
      index: 'engine-ayse',
      collection: 'assets-history',
      body: { sort: { '_kuzzle_info.createdAt': 'desc' } },
    });

    expect(response.result).toMatchObject({
      hits: {
        '0': {
          _source: {
            id: 'Container-linked1',
            event: {
              name: 'unlink',
              unlink: { deviceId: 'DummyTemp-linked1' },
            },
            asset: { linkedMeasures: [] },
          },
        },
        length: 1,
      },
    });
  });
});
