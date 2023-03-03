
      import { beforeEachTruncateCollections } from "../hooks/collections";
      import { beforeAllCreateEngines } from "../hooks/engines";
      import { beforeEachLoadFixtures } from "../hooks/fixtures";

      import { useSdk, sendPayloads } from "../helpers";

      jest.setTimeout(10000);

      describe("Device/Controller/AttachEngine", () => {
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
      
      it("Attach a device to an engine and historize measures", async () => {
        let response;
        let promise;
    
        response = await sdk.query({
  "controller": "device-manager/devices",
  "action": "attachEngine",
  "_id": "DummyTemp-detached1",
  "engineId": "engine-kuzzle"
});
      
      await expect(
        sdk.document.get("device-manager", "devices", "DummyTemp-detached1")
      ).resolves.toMatchObject({
        _source: {
  "engineId": "engine-kuzzle",
  "_kuzzle_info": {
    "updater": "-1"
  }
}
      });
    
      await expect(
        sdk.document.get("engine-kuzzle", "devices", "DummyTemp-detached1")
      ).resolves.toMatchObject({
        _source: {
  "engineId": "engine-kuzzle",
  "_kuzzle_info": {
    "author": "-1"
  }
}
      });
    
      await sendPayloads(sdk, "dummy-temp", [
  {
    "deviceEUI": "detached1",
    "temperature": 21
  }
])
    
      await sdk.collection.refresh("engine-kuzzle", "measures");
      await expect(sdk.document.count("engine-kuzzle", "measures")).resolves.toBe(1)
    
      });
    
      it("Errors when attaching a device to an engine", async () => {
        let response;
        let promise;
    
        promise = sdk.query({
  "controller": "device-manager/devices",
  "action": "attachEngine",
  "_id": "Not-existing-device",
  "engineId": "engine-kuzzle"
});
      
    await expect(promise).rejects.toMatchObject({
  "id": "services.storage.not_found"
})
  
        promise = sdk.query({
  "controller": "device-manager/devices",
  "action": "attachEngine",
  "_id": "DummyTemp-detached1",
  "engineId": "engine-kaliop"
});
      
    await expect(promise).rejects.toMatchObject({
  "message": "Engine \"engine-kaliop\" does not exists."
})
  
        response = await sdk.query({
  "controller": "device-manager/devices",
  "action": "attachEngine",
  "_id": "DummyTemp-detached1",
  "engineId": "engine-kuzzle"
});
      
        promise = sdk.query({
  "controller": "device-manager/devices",
  "action": "attachEngine",
  "_id": "DummyTemp-detached1",
  "engineId": "engine-kuzzle",
  "strict": true
});
      
    await expect(promise).rejects.toMatchObject({
  "message": "Device \"DummyTemp-detached1\" is already attached to an engine."
})
  
      });
    
      });
    