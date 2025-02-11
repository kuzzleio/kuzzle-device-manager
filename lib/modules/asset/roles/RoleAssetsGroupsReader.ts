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
export const RoleAssetsGroupsReader: KuzzleRole = {
  name: "assetsGroup.reader",
  definition: {
    controllers: {
      "device-manager/assetsGroup": {
        actions: {
          get: true,
          search: true,
        },
      },
      "device-manager/models": {
        actions: {
          listGroups: true,
          getGroup: true,
        },
      },
    },
  },
};
