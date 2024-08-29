import { KuzzleRole } from "../../../shared/types/KuzzleRole";

/**
 * This role allows to create, update and delete a device.
 *
 * It's a tenant role.
 *
 */
export const RoleDevicesCreation: KuzzleRole = {
  definition: {
    controllers: {
      "device-manager/devices": {
        actions: {
          create: true,
          delete: true,
          upsert: true,
        },
      },
    },
  },
  name: "devices.creation",
};
