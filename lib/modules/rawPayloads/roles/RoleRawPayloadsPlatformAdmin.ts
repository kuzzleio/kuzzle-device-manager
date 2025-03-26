import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role only gives a read-only access to raw payload.
 *
 * It's a tenant role.
 *
 * @example
    "device-manager/rawPayloads": {
      actions: {
        get: true,

      },
    }
 */
export const RoleRawPayloadsPlatformAdmin: KuzzleRole = {
  name: "rawPayloads.platform-admin",
  definition: {
    controllers: {
      "device-manager/rawPayloads": {
        actions: {
          get: true,
        },
      },
    },
  },
} as const;
