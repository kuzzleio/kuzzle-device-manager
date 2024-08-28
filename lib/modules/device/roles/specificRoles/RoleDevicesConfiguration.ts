import { KuzzleRole } from "../../../shared/types/KuzzleRole";

/**
 * This role allows to configurate a device metadata.
 *
 * It's a tenant role.
 *
 */
export const RoleDevicesConfiguration: KuzzleRole = {
  definition: {
    controllers: {
      "device-manager/devices": {
        actions: { replaceMetadata: true },
      },
    },
  },
  name: "devices.configuration",
};
