import { KuzzleRole } from "../../shared/types/KuzzleRole";

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
