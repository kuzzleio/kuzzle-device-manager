import { Kuzzle } from "kuzzle-sdk";

import rights from "../fixtures/rights";

export async function loadSecurityDefault(sdk: Kuzzle) {
  try {
    sdk.jwt = null;
  
    await sdk.query({
      controller: "admin",
      action: "loadSecurities",
      body: rights,
      refresh: "wait_for",
      onExistingUsers: "overwrite",
    });
    console.log("loadSecurities executed")
  } catch (error) {
    console.error("ERROR: loadSecurityDefault", error)
  }
}
