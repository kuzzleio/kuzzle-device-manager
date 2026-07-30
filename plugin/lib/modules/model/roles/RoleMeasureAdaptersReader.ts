import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role allows to list measure adapter models.
 *
 * It's a tenant role.
 *
 * @example
    "device-manager/models": {
      actions: {
        listMeasureAdapters: true,
        getMeasureAdapter: true,
      },
    },
 */
export const RoleMeasureAdaptersReader: KuzzleRole = {
  name: "measure-adapters.reader",
  definition: {
    controllers: {
      "device-manager/models": {
        actions: {
          listMeasureAdapters: true,
          getMeasureAdapter: true,
        },
      },
    },
  },
};
