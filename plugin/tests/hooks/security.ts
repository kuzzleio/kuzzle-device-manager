import { Kuzzle } from "kuzzle-sdk";

import rights from "../fixtures/rights";

export async function loadSecurityDefault(sdk: Kuzzle) {
  sdk.jwt = null;

  // Clean up users + credentials before loadSecurities to prevent
  // "existing credentials found on non-existing user" errors
  // when test suites run sequentially against the same Kuzzle instance.
  for (const userId of Object.keys(rights.users)) {
    try {
      await sdk.security.deleteCredentials("local", userId);
    } catch {
      // Credentials may not exist, ignore
    }
    try {
      await sdk.security.deleteUser(userId, { refresh: "wait_for" });
    } catch {
      // User may not exist, ignore
    }
  }

  await sdk.query({
    controller: "admin",
    action: "loadSecurities",
    body: rights,
    refresh: "wait_for",
    onExistingUsers: "overwrite",
  });
}
