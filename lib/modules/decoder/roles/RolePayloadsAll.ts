import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role allows to receive any kind of payloads.
 *
@example
    "device-manager/payloads": {
      actions: {
        "*": true,
      },
    },
 */
export const RolePayloadsAll: KuzzleRole = {
  name: 'payloads.admin',
  definition: {
    controllers: {
      "device-manager/payloads": {
        actions: {
          "*": true,
        },
      },
    },
  }
}
