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
        getLastMeasures: true,
        mGetLastMeasures: true,
        exportMeasures: true,
        search: true,
        getLastMeasuredAt: true,
        mGetLastMeasuredAt: true,
      },
    },
    "device-manager/models": {
      actions: {
        listAssets: true,
        listMeasures: true,
        getAsset: true,
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
          getLastMeasures: true,
          mGetLastMeasures: true,
          exportMeasures: true,
          search: true,
          getLastMeasuredAt: true,
          mGetLastMeasuredAt: true,
        },
      },
      "device-manager/models": {
        actions: {
          listAssets: true,
          getAsset: true,
          listMeasures: true,
        },
      },
    },
  },
} as const;
