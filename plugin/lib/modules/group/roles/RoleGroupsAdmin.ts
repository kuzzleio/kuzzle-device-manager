import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role allows to manage groups and their models.
 *
 * It's a tenant role.
 *
 * @example
 *
    "device-manager/groups": {
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
export const RoleGroupsAdmin: KuzzleRole = {
  name: "group.admin",
  definition: {
    controllers: {
      "device-manager/groups": {
        actions: {
          "*": true,
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
