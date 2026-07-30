import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role allows to manage measure adapters.
 *
 * It's a tenant role.
 */
export const RoleMeasureAdaptersAdmin: KuzzleRole = {
  name: "measure-adapters.admin",
  definition: {
    controllers: {
      "device-manager/measureAdapters": {
        actions: {
          "*": true,
        },
      },
    },
  },
};
