import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role allows to manage devices and also assign them to tenants.
 *
 * It's a platform admin role.
 *
 * @example
    "device-manager/devices": {
      actions: {
        "*": true,
      },
    },
    "device-manager/models": {
      actions: {
        deleteDevice: true,
        listDevices: true,
        writeDevice: true,
      },
    },
 */
export const RoleDevicesPlatformAdmin: KuzzleRole = {
  name: "devices.platform-admin",
  definition: {
    controllers: {
      "device-manager/devices": {
        actions: {
          "*": true,
        },
      },
      "device-manager/models": {
        actions: {
          deleteDevice: true,
          listDevices: true,
          writeDevice: true,
        },
      },
    },
  }
};
