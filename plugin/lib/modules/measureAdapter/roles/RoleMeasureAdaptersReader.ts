import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role allows to read measure adapters.
 *
 * It's a tenant role.
 */
export const RoleMeasureAdaptersReader: KuzzleRole = {
  name: "measure-adapters.reader",
  definition: {
    controllers: {
      "device-manager/measureAdapters": {
        actions: {
          get: true,
          search: true,
        },
      },
    },
  },
};
