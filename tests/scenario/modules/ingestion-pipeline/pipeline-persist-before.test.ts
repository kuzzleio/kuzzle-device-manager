import { sendDummyTempPayloads, setupHooks } from "../../../helpers";

jest.setTimeout(10000);

describe("Ingestion Pipeline: persist before", () => {
  const sdk = setupHooks();

  it("exposes the updated asset via the persist before event", async () => {
    // The persist pipe (registered on "device-manager:measures:persist:sourceBefore")
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
      ]),
    ).resolves.toBeUndefined();
  });
});
