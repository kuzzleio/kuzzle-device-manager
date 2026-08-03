import { KuzzleRole } from "../../shared/types/KuzzleRole";

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
