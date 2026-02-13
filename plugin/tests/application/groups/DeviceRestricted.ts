import { GroupContent } from "lib/modules/group/exports";
import { GroupModel } from "lib/modules/shared";

const modelName = "DeviceRestricted";

export interface DeviceRestrictedContent extends GroupContent {
  model: typeof modelName;
}

export const DeviceRestricted: GroupModel = {
  modelName,
  definition: {
    affinity: {
      type: ["devices"],
      models: { devices: ["DummyTemp"] },
      strict: true,
    },
  },
};
