import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk } from "../../helpers";

jest.setTimeout(10000);

describe("features/Device/Controller/upsert", () => {
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
it("Upsert device", async () => {
    const response = await sdk.query({
      controller: "device-manager/devices",
      action: "upsert",
      engineId: "engine-kuzzle",
      _id: "DummyTemp-detached1",
      body: {
        model: "DummyTemp",
        reference: "detached1",
        metadata: { color: 'red' },
      },
    });

    expect(response).toBeDefined();
    expect(response.result).toBeDefined();
    expect(response.result._id).toEqual("DummyTemp-detached1");
    expect(response.result._source.model).toEqual("DummyTemp");
    expect(response.result._source.reference).toEqual("detached1");
    expect(response.result._source.metadata).toEqual({ color: 'red' });
});

  it("Upsert device - update existing device", async () => {
    // create device
    await sdk.query({
        controller: "device-manager/devices",
        action: "upsert",
        engineId: "engine-kuzzle",
        _id: "DummyTemp-detached1",
        body: {
          model: "DummyTemp",
          reference: "detached1",
          metadata: { color: 'blue' },
        },
      });

    // update device
    const response = await sdk.query({
        controller: "device-manager/devices",
        action: "upsert",
        engineId: "engine-kuzzle",
        _id: "DummyTemp-detached1",
        body: {
          model: "DummyTemp",
          reference: "detached1",
          metadata: { color: 'red' },
        },
    });

    expect(response).toBeDefined();
    expect(response.result).toBeDefined();
    expect(response.result._id).toEqual("DummyTemp-detached1");
    expect(response.result._source.model).toEqual("DummyTemp");
    expect(response.result._source.reference).toEqual("detached1");
    expect(response.result._source.metadata).toEqual({ color: 'red' });
  })

  it('Throws if upsert has no engine id', async () => {

    // update asset
    let promise
    promise = sdk.query({
        controller: "device-manager/devices",
        action: "upsert",
        _id: "DummyTemp-detached1",
        body: {
          model: "DummyTemp",
          reference: "detached1",
          metadata: { color: 'red' },
        },
    });

    await expect(promise).rejects.toThrow('Missing argument "engineId"');
  })

  it('Throws if upsert is on another engine id', async () => {
    // create device
    await sdk.query({
        controller: "device-manager/devices",
        action: "upsert",
        _id: "DummyTemp-detached1",
        engineId: "engine-kuzzle",
        body: {
          model: "DummyTemp",
          reference: "detached1",
          metadata: { color: 'blue' },
        },
    });
    // update device
    let promise
    promise = sdk.query({
        controller: "device-manager/devices",
        action: "upsert",
        engineId: "engine-ayse",
        _id: "DummyTemp-detached1",
        body: {
          model: "DummyTemp",
          reference: "detached1",
          metadata: { color: 'red' },
        },
    });
    
    await expect(promise).rejects.toThrow('Device "DummyTemp-detached1" already exists on another engine. Abort');
  })
});