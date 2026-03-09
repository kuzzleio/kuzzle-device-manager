import { Kuzzle } from "kuzzle-sdk";

import fixtures from "../fixtures/fixtures";

export async function beforeEachLoadFixtures(sdk: Kuzzle) {
  await sdk.query({
    controller: "admin",
    action: "loadFixtures",
    refresh: "false",
    body: fixtures,
  });

  // Refresh all fixtures collections (faster than refresh of loadFixtures)
  for (const index of Object.keys(fixtures)) {
    for (const collection of Object.keys(fixtures[index])) {
      await sdk.collection.refresh(index, collection);
    }
  }
}
