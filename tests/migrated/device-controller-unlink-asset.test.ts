
      import { beforeEachTruncateCollections } from "../hooks/collections";
      import { beforeAllCreateEngines } from "../hooks/engines";
      import { beforeEachLoadFixtures } from "../hooks/fixtures";

      import { useSdk, sendPayloads } from "../helpers";

      jest.setTimeout(10000);

      describe("Device/Controller/UnlinkAsset", () => {
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
      
      it("Unlink the asset", async () => {
        let response;
        let promise;
    
        response = await sdk.query({
  "controller": "device-manager/devices",
  "action": "unlinkAsset",
  "engineId": "engine-ayse",
  "_id": "DummyTemp-linked1"
});
      
      await expect(
        sdk.document.get("device-manager", "devices", "DummyTemp-linked1")
      ).resolves.toMatchObject({
        _source: {
  "assetId": null
}
      });
    
      await expect(
        sdk.document.get("engine-ayse", "devices", "DummyTemp-linked1")
      ).resolves.toMatchObject({
        _source: {
  "assetId": null
}
      });
    
      await expect(
        sdk.document.get("engine-ayse", "assets", "Container-linked1")
      ).resolves.toMatchObject({
        _source: {
  "linkedDevices": {
    "length": 0
  }
}
      });
    
      });
    
      it("Error when the device was not linked", async () => {
        let response;
        let promise;
    
        promise = sdk.query({
  "controller": "device-manager/devices",
  "action": "unlinkAsset",
  "_id": "DummyTemp-unlinked1"
});
      
    await expect(promise).rejects.toMatchObject({
  "message": "Device \"DummyTemp-unlinked1\" is not linked to an asset."
})
  
      });
    
      it("Unlink asset when deleting device", async () => {
        let response;
        let promise;
    
        response = await sdk.query({
  "controller": "device-manager/devices",
  "action": "delete",
  "engineId": "engine-ayse",
  "_id": "DummyTemp-linked1"
});
      
      await expect(
        sdk.document.get("engine-ayse", "assets", "Container-linked1")
      ).resolves.toMatchObject({
        _source: {
  "linkedDevices": {
    "length": 0
  }
}
      });
    
      await sdk.collection.refresh("engine-ayse", "assets-history");
    
        response = await sdk.query({
  "controller": "document",
  "action": "search",
  "index": "engine-ayse",
  "collection": "assets-history",
  "body": {
    "sort": {
      "_kuzzle_info.createdAt": "desc"
    }
  }
});
      
    expect(response.result).toMatchObject({
  "hits": {
    "0": {
      "_source": {
        "id": "Container-linked1",
        "event": {
          "name": "unlink",
          "unlink": {
            "deviceId": "DummyTemp-linked1"
          }
        },
        "asset": {
          "linkedDevices": []
        }
      }
    },
    "length": 1
  }
});
  
      });
    
      });
    