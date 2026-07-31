import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role allows to read (get/list) measure adapters registered in code.
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
