import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role allows to list measure models.
 *
 * It's a tenant role.
 *
 * @example
    "device-manager/models": {
      actions: {
        listMeasures: true,
      },
    },
 */
export const RoleMeasuresReader: KuzzleRole = {
  name: "measures.reader",
  definition: {
    controllers: {
      "device-manager/models": {
        actions: {
          listMeasures: true,
        },
      },
    },
  },
};
