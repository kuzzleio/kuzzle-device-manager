import { KuzzleRole } from "../../../shared/types/KuzzleRole";

/**
 * This role allows to create, update and delete an asset.
 *
 * It's a tenant role.
 *
 */
export const RoleAssetsCreation: KuzzleRole = {
  definition: {
    controllers: {
      "device-manager/assets": {
        actions: {
          create: true,
          delete: true,
          update: true,
          upsert: true,
        },
      },
    },
  },
  name: "assets.creation",
};
