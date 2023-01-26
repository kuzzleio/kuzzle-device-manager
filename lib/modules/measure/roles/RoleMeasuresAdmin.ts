import { KuzzleRole } from "../../shared/types/KuzzleRole";

/**
 * This role allows to manage measure models.
 *
 * It's a tenant role.
 *
 * @example
    "device-manager/models": {
      actions: {
        deleteMeasure: true,
        listMeasures: true,
        getMeasure: true,
        writeMeasure: true,
      },
    },
 */
export const RoleMeasuresAdmin: KuzzleRole = {
  name: "measures.admin",
  definition: {
    controllers: {
      "device-manager/models": {
        actions: {
          deleteMeasure: true,
          listMeasures: true,
          getMeasure: true,
          writeMeasure: true,
        },
      },
    },
  },
};
