import { KuzzleRole } from "lib/modules/shared/types/KuzzleRole";

/**
 * This role allows to push measures and manage their models.
 *
 * It's a tenant role.
 *
 * @example
    "device-manager/measures": {
      actions: {
        "*": true,
      },
    },
    "device-manager/models": {
      actions: {
        deleteMeasure: true,
        listMeasures: true,
        writeMeasure: true,
      },
    },
 */
export const RoleMeasuresAdmin: KuzzleRole = {
  name: "measures.admin",
  definition: {
    controllers: {
      "device-manager/measures": {
        actions: {
          "*": true,
        },
      },
      "device-manager/models": {
        actions: {
          deleteMeasure: true,
          listMeasures: true,
          writeMeasure: true,
        },
      },
    },
  }
}