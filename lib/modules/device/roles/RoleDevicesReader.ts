import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role only gives a read-only access to devices and their models.
 *
 * It's a tenant role.
 *
 * @example
    "device-manager/devices": {
      actions: {
        get: true,
        search: true,
      },
    },
    "device-manager/models": {
      actions: {
        listDevices: true,
      },
    },
    }
 */
export const RoleDevicesReader: KuzzleRole = {
  name: 'devices.reader',
  definition: {
    controllers: {
      "device-manager/devices": {
        actions: {
          get: true,
          search: true,
        },
      },
      "device-manager/models": {
        actions: {
          listDevices: true,
        },
      },
    },
  }
}