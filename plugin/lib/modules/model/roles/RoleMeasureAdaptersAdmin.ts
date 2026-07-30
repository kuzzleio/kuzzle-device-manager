import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role allows to manage measure adapter models.
 *
 * It's a tenant role.
 *
 * @example
    "device-manager/models": {
      actions: {
        deleteMeasureAdapter: true,
        listMeasureAdapters: true,
        getMeasureAdapter: true,
        writeMeasureAdapter: true,
      },
    },
 */
export const RoleMeasureAdaptersAdmin: KuzzleRole = {
  name: "measure-adapters.admin",
  definition: {
    controllers: {
      "device-manager/models": {
        actions: {
          deleteMeasureAdapter: true,
          listMeasureAdapters: true,
          getMeasureAdapter: true,
          writeMeasureAdapter: true,
        },
      },
    },
  },
};
