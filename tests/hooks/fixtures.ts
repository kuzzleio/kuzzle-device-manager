import { Kuzzle } from "kuzzle-sdk";

const fixtures = require('../../features/fixtures/fixtures');

export async function beforeEachLoadFixtures (sdk: Kuzzle) {
  await sdk.query({
    controller: "admin",
    action: "loadFixtures",
    refresh: "false",
    body: fixtures,
  });
}
