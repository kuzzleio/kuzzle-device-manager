import { KuzzleRole } from "../../../shared/types/KuzzleRole";

/**
 * This role allows to configure a device metadata.
 *
 * It's a tenant role.
 *
 */
export const RoleDevicesConfiguration: KuzzleRole = {
  definition: {
    controllers: {
      "device-manager/devices": {
        actions: { replaceMetadata: true, update: true },
      },
    },
  },
  name: "devices.configuration",
};
