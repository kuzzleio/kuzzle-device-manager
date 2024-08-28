import { KuzzleRole } from "../../../shared/types/KuzzleRole";

/**
 * This role allows to configurate an asset metadata.
 *
 * It's a tenant role.
 *
 */
export const RoleAssetsConfiguration: KuzzleRole = {
  definition: {
    controllers: {
      "device-manager/assets": {
        actions: { replaceMetadata: true },
      },
    },
  },
  name: "assets.configuration",
};
