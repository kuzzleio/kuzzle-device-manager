import { Kuzzle } from "kuzzle-sdk";
import { beforeEachTruncateCollections } from "../hooks/collections";
import { beforeAllCreateEngines } from "../hooks/engines";
import { beforeEachLoadFixtures } from "../hooks/fixtures";
import { useSdk } from "./sdk";

export function setupHooks(): Kuzzle {
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

  return sdk;
}
