import { Kuzzle } from "kuzzle-sdk";

import rights from "../fixtures/rights";

export async function loadSecurityDefault(sdk: Kuzzle) {
  sdk.jwt = null;

  await sdk.query({
    controller: "admin",
    action: "loadSecurities",
    body: rights,
    refresh: "wait_for",
    onExistingUsers: "overwrite",
  });
}
