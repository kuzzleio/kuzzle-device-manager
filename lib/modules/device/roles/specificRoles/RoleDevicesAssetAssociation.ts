import { KuzzleRole } from "../../../shared/types/KuzzleRole";

/**
 * This role allows to associate assets and devices.
 *
 * It's a tenant role.
 *
 */
export const RoleDevicesAssetAssociation: KuzzleRole = {
  definition: {
    controllers: {
      "device-manager/devices": {
        actions: { linkAssets: true, unlinkAssets: true },
      },
    },
  },
  name: "devices.assetAssociation",
};
