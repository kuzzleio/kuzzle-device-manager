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
      },
    },
 */
export const RoleAssetsAdmin: KuzzleRole = {
  name: "assets.admin",
  definition: {
    controllers: {
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
        },
      },
    },
  },
};
