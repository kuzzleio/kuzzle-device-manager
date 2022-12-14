import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role allows to manage devices.
 *
 * It's a tenant role.
 *
 * @example
    "device-manager/devices": {
      actions: {
        create: true,
        delete: true,
        get: true,
        linkAsset: true,
        search: true,
        unlinkAsset: true,
        update: true,
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
export const RoleDevicesAdmin: KuzzleRole = {
  name: "devices.admin",
  definition: {
    controllers: {
      "device-manager/devices": {
        actions: {
          create: true,
          delete: true,
          get: true,
          linkAsset: true,
          search: true,
          unlinkAsset: true,
          update: true,
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
  },
};
