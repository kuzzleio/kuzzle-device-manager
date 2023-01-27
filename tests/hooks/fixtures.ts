import { Kuzzle } from "kuzzle-sdk";

import fixtures from "../../features/fixtures/fixtures";

export async function beforeEachLoadFixtures(sdk: Kuzzle) {
  await sdk.query({
    controller: "admin",
    action: "loadFixtures",
    refresh: "false",
    body: fixtures,
  });
}
