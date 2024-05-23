import { Kuzzle } from "kuzzle-sdk";

import rights from "../fixtures/rights";

export async function loadSecurityDefault(sdk: Kuzzle) {
  sdk.jwt = null;
  if (!(await sdk.auth.getCurrentUser())._id.includes("admin")) {
    await sdk.auth.login("local", {
      username: "admin",
      password: "password",
    });
  }

  await sdk.query({
    controller: "admin",
    action: "loadSecurities",
    body: rights,
    refresh: "wait_for",
    onExistingUsers: "overwrite",
  });
}
