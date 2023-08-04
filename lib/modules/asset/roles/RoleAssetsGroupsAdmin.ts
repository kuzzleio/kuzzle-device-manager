import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role allows to manage assets and their models.
 *
 * It's a tenant role.
 *
 * @example
 *
    "device-manager/assets": {
      actions: {
        "*": true,
      },
    },
    "device-manager/models": {
      actions: {
        deleteAsset: true,
        listAssets: true,
        getAsset: true,
        writeAsset: true,
        listMeasures: true,
      },
    },
 */
export const RoleAssetsGroupsAdmin: KuzzleRole = {
  name: "assetsGroup.admin",
  definition: {
    controllers: {
      "device-manager/assetsGroup": {
        actions: {
          "*": true,
        },
      },
    },
  },
};
