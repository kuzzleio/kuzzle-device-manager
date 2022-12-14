import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * Role used to manage decoders and their payloads.
 *
 * It's a platform admin role.
 *
 * @example
    "device-manager/decoders": {
      actions: {
        "*": true,
      },
    },
 */
export const RoleDecodersAdmin: KuzzleRole = {
  name: 'decoders.admin',
  definition: {
    controllers: {
      "device-manager/decoders": {
        actions: {
          "*": true,
        },
      },
    },
  }
}
