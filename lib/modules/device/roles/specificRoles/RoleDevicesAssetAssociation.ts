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
        actions: { linkAsset: true, unlinkAsset: true },
      },
    },
  },
  name: "devices.assetAssociation",
};
