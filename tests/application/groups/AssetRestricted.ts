import { GroupContent } from "lib/modules/group/exports";
import { GroupModel } from "lib/modules/shared";

const modelName = "AssetRestricted";

export interface AssetRestrictedContent extends GroupContent {
  model: typeof modelName;
}

export const AssetRestricted: GroupModel = {
  modelName,
  definition: {
    affinity: {
      type: ["assets"],
      models: { assets: ["Container"] },
      strict: true,
    },
  },
};
