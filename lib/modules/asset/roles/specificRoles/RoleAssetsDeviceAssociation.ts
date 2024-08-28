import { KuzzleRole } from "../../../shared/types/KuzzleRole";

/**
 * This role allows to associate assets and devices.
 *
 * It's a tenant role.
 *
 */
export const RoleAssetsDeviceAssociation: KuzzleRole = {
  definition: {
    controllers: {
      "device-manager/devices": {
        actions: { linkAsset: true, unlinkAsset: true },
      },
    },
  },
  name: "assets.deviceAssociation",
};
