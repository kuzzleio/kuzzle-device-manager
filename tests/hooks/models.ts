import { Kuzzle } from "kuzzle-sdk";
import * as assets from "../application/assets";
import * as devices from "../application/devices";
import * as measures from "../application/measures";
import * as groups from "../application/groups";

// ? List of embedded measures register directly by plugin
const embeddedMeasures = [
  "temperature",
  "position",
  "movement",
  "humidity",
  "battery",
].map((measure) => `model-measure-${measure}`);

// ? List of models defined by test application
const assetsModels = Object.values(assets).map(
  (model) => `model-asset-${model.modelName}`,
);
const devicesModels = Object.values(devices).map(
  (model) => `model-device-${model.modelName}`,
);
const measuresModels = Object.values(measures).map(
  (model) => `model-measure-${model.modelName}`,
);
const groupModels = Object.values(groups).map(
  (model) => `model-group-${model.modelName}`,
);
export async function deleteModels(sdk: Kuzzle) {
  // ? Exclude ids of models defined in code to remove all others, instead of use a hard coded list
  // * This avoids forgetting when adding measurements in the tests
  const excludesIds = [
    ...embeddedMeasures,
    ...assetsModels,
    ...devicesModels,
    ...measuresModels,
    ...groupModels,
  ];

  await sdk.collection.refresh("device-manager", "models");
  await sdk.document.deleteByQuery("device-manager", "models", {
    query: {
      bool: {
        must_not: {
          ids: {
            values: excludesIds,
          },
        },
      },
    },
  });
  await sdk.collection.refresh("device-manager", "models");
}
