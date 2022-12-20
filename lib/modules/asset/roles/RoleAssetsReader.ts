import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role only gives a read-only access to assets and their models.
 *
 * It's a tenant role.
 *
 * @example
    "device-manager/assets": {
      actions: {
        get: true,
        getMeasures: true,
        search: true,
      },
    },
    "device-manager/models": {
      actions: {
        listAssets: true,
      },
    },
 */
export const RoleAssetsReader: KuzzleRole = {
  name: "assets.reader",
  definition: {
    controllers: {
      "device-manager/assets": {
        actions: {
          get: true,
          getMeasures: true,
          search: true,
        },
      },
      "device-manager/models": {
        actions: {
          listAssets: true,
        },
      },
    },
  },
} as const;
