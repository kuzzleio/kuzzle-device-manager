import { beforeEachTruncateCollections } from "../../hooks/collections";
import { beforeAllCreateEngines } from "../../hooks/engines";
import { beforeEachLoadFixtures } from "../../hooks/fixtures";

import { useSdk, sendPayloads } from "../../helpers";

jest.setTimeout(10000);

describe("features/Device/Roles", () => {
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

  it("Find default devices roles", async () => {
    let response;
    let promise;

    await expect(sdk.security.getRole("devices.reader")).resolves.toMatchObject(
      {
        controllers: {
          "device-manager/devices": { actions: { get: true, search: true } },
          "device-manager/models": { actions: { listDevices: true } },
        },
      }
    );

    await expect(sdk.security.getRole("devices.admin")).resolves.toMatchObject({
      controllers: {
        "device-manager/devices": {
          actions: {
            create: true,
            get: true,
            update: true,
            search: true,
            delete: true,
            linkAsset: true,
            unlinkAsset: true,
          },
        },
        "device-manager/models": {
          actions: { listDevices: true, writeDevice: true, deleteDevice: true },
        },
      },
    });

    await expect(
      sdk.security.getRole("devices.platform-admin")
    ).resolves.toMatchObject({
      controllers: {
        "device-manager/devices": { actions: { "*": true } },
        "device-manager/models": {
          actions: { listDevices: true, writeDevice: true, deleteDevice: true },
        },
      },
    });
  });
});
