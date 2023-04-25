import { ContainerAssetContent } from "../../../application/assets/Container";

import { sendDummyTempPayloads, setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("Ingestion Pipeline: persist before", () => {
  const sdk = setupHooks();

  it("expose the updated asset and device", async () => {
    // Pipe will fail if something is wrong
    await expect(
      sendDummyTempPayloads(sdk, [
        {
          deviceEUI: "linked1",
          temperature: 42,
          metadata: {
            // search this string to find the associated pipe
            color: "test-persist-before-event-temperature-42",
          },
        },
      ])
    ).resolves.toBeUndefined();
  });
});
