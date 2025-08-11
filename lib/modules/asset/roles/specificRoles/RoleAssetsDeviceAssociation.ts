import { KuzzleRole } from "lib/modules/shared";

/**
 * This role allows to associate assets and devices.
 *
 * It's a tenant role.
 *
 */
export const RoleAssetsDeviceAssociation: KuzzleRole = {
  definition: {
    controllers: {
      "device-manager/assets": {
        actions: { linkDevices: true, unlinkDevices: true },
      },
    },
  },
  name: "assets.deviceAssociation",
};
