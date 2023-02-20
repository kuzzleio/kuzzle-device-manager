import {
  ApiDeviceLinkAssetRequest,
  ApiDeviceLinkAssetResult,
} from "../../../index";

import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk } from "../../helpers/sdk";

jest.setTimeout(10000);

describe("DeviceController: receiveMeasure", () => {
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

  it("should throw an error if no measures are selected", async () => {
    await expect(
      sdk.query<ApiDeviceLinkAssetRequest, ApiDeviceLinkAssetResult>({
        controller: "device-manager/devices",
        action: "linkAsset",
        engineId: "engine-ayse",
        _id: "DummyTempPosition-unlinked3",
        assetId: "Container-unlinked1",
      })
    ).rejects.toMatchObject({
      message:
        'You must provide at least one measure name or set "implicitMeasuresLinking" to true.',
    });
  });
});
