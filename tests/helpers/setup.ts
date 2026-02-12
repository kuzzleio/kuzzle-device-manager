import { Kuzzle } from "kuzzle-sdk";
import { beforeEachTruncateCollections } from "../hooks/collections";
import { beforeAllCreateEngines } from "../hooks/engines";
import { beforeEachLoadFixtures } from "../hooks/fixtures";
import { useSdk } from "./sdk";

export function setupHooks(): Kuzzle {
  const sdk = useSdk();

  console.log("sdk", sdk)

  beforeAll(async () => {
    console.log("called connect")
    await sdk.connect();
    console.log("Connected");
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

export function setupSdK(): Kuzzle {
  const sdk = useSdk();

  beforeAll(async () => {
    await sdk.connect();
    await beforeAllCreateEngines(sdk);
  });

  afterAll(async () => {
    sdk.disconnect();
  });

  return sdk;
}
