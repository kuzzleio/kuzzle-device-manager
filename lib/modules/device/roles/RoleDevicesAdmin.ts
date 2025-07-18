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
        getMeasures: true,
        exportMeasures: true,
      },
    },
    "device-manager/models": {
      actions: {
        deleteDevice: true,
        listDevices: true,
        getDevice: true,
        writeDevice: true,
        listMeasures: true,
      },
    },
 */
export const RoleDevicesAdmin: KuzzleRole = {
  name: "devices.admin",
  definition: {
    controllers: {
      "device-manager/devices": {
        actions: {
          attachEngine: true,
          create: true,
          detachEngine: true,
          get: true,
          linkAsset: true,
          search: true,
          unlinkAsset: true,
          update: true,
          getMeasures: true,
          exportMeasures: true,
        },
      },
      "device-manager/models": {
        actions: {
          deleteDevice: true,
          listDevices: true,
          getDevice: true,
          writeDevice: true,
          listMeasures: true,
        },
      },
    },
  },
};
