#!/usr/bin/env node
/* eslint-disable no-console */
import {
  transformDocuments,
  clearProperties,
  retrieveModelMeasureSlots,
  ModelRegistry,
} from "./utils.js";

const args: any = {};
for (let index = 0; index < process.argv.length; index++) {
  const val = process.argv[index];
  if (val.startsWith("--")) {
    const [key, value] = val.replace("--", "").split("=");
    args[key] = value || true;
  }
}

const pathToTenantIndex = args["tenant-index"] || process.env.TENANT_INDEX;
const pathToPlatformIndex =
  args["platform-index"] || process.env.PLATFORM_INDEX;
const includeSoftTenants =
  args["with-soft-tenants"] || process.env.WITH_SOFT_TENANTS;

if (!pathToTenantIndex) {
  throw new Error(
    "TENANT_INDEX env variable or --tenant-index flag is required",
  );
}
if (!pathToPlatformIndex) {
  throw new Error(
    "PLATFORM_INDEX env variable or --platform-index is required",
  );
}

const linkedDevices = {};

console.info("MIGRATING " + pathToTenantIndex);
console.info("WITH_SOFT_TENANTS " + includeSoftTenants);

// RETRIEVE MEASURESLOTS FROM MODELS
retrieveModelMeasureSlots(pathToPlatformIndex, (models: ModelRegistry) =>
  // ASSETS
  transformDocuments(
    "assets",
    pathToTenantIndex,
    (line) => {
      const propertiesToDelete = [
        "measures",
        "linkedDevices",
        "lastMeasuredAt",
      ];
      if (!includeSoftTenants) {
        propertiesToDelete.push("softTenant");
      }
      const obj = JSON.parse(line);
      // Check line is a document
      if (obj.body) {
        if (obj.body.groups && obj.body.groups.length) {
          obj.body.groups = obj.body.groups.map((gr) => {
            if (gr.id) {
              return { date: gr.date, path: gr.id };
            }
            return gr;
          });
        }
        obj.body.linkedMeasures = [];
        obj.body.measureSlots = [...models.assets[obj.body.model]];
        if (obj.body.linkedDevices && obj.body.linkedDevices.length) {
          // Fill the obj of linked devices for later device collection migration
          obj.body.linkedMeasures = obj.body.linkedDevices.map((link) => {
            const measureSlots = link.measureNames.map((m) => ({
              asset: m.asset,
              device: m.device,
            }));
            const deviceLink = { assetId: obj._id, measureSlots };

            if (Array.isArray(linkedDevices[link._id])) {
              linkedDevices[link._id].push(deviceLink);
            } else {
              linkedDevices[link._id] = [deviceLink];
            }
            return { deviceId: link._id, measureSlots };
          });
        }
        obj.body = clearProperties(obj.body, propertiesToDelete);
      }
      return obj;
    },
    () => {
      // DEVICES LAUNCHED ONLY AFTER THE ASSET FILE IS DONE TO HAVE ALL THE LINKED DEVICES
      transformDocuments("devices", pathToTenantIndex, (line) => {
        const propertiesToDelete = [
          "assetId",
          "measures",
          "linkedDevices",
          "lastMeasuredAt",
        ];
        const obj = JSON.parse(line);
        // Check line is a document

        if (obj.body) {
          obj.body.measureSlots = [...models.devices[obj.body.model]];

          if (obj.body.groups && obj.body.groups.length) {
            obj.body.groups = obj.body.groups.map((gr) => {
              if (gr.id) {
                return { date: gr.date, path: gr.id };
              }
              return gr;
            });
          }
          obj.body.linkedMeasures = [];
          if (linkedDevices[obj._id]) {
            // Fill the obj of linked devices for later device collection migration
            obj.body.linkedMeasures = linkedDevices[obj._id];
          }
          obj.body = clearProperties(obj.body, propertiesToDelete);
        }
        return obj;
      });
    },
  ),
);

// ASSET-HISTORY
transformDocuments("assets-history", pathToTenantIndex, (line) => {
  const propertiesToDelete = ["measures", "linkedDevices", "lastMeasuredAt"];
  if (!includeSoftTenants) {
    propertiesToDelete.push("softTenant");
  }
  const obj = JSON.parse(line);
  // Check line is a document
  if (obj.body) {
    const asset = obj.body.asset;
    if (asset) {
      if (asset.groups && asset.groups.length) {
        asset.groups = asset.groups.map((gr) => {
          if (gr.id) {
            return { date: gr.date, path: gr.id };
          }
          return gr;
        });
      }
      asset.linkedMeasures = [];
      if (asset.linkedDevices && asset.linkedDevices.length) {
        // Fill the obj of linked devices for later device collection migration
        asset.linkedMeasures = asset.linkedDevices.map((d) => {
          const measureSlots = d.measureNames.map((m) => ({
            asset: m.asset,
            device: m.device,
          }));
          return { deviceId: d._id, measureSlots };
        });
      }
      obj.body.asset = clearProperties(asset, propertiesToDelete);
    }
  }
  return obj;
});
// GROUPS
transformDocuments("assets-groups", pathToTenantIndex, (line) => {
  const propertiesToDelete = ["parent", "children"];
  const obj = JSON.parse(line);
  // Check line is a document

  if (obj.body) {
    if (obj.body.parent) {
      obj.body.path = obj.body.parent + "." + obj._id;
    } else {
      obj.body.path = obj._id;
    }
    if (linkedDevices[obj._id]) {
      // Fill the obj of linked devices for later device collection migration
      obj.body.linkedMeasures = linkedDevices[obj._id];
    }
    obj.body = clearProperties(obj.body, propertiesToDelete);
  } else if (obj.collection === "assets-groups") {
    obj.collection = "groups";
  }
  return obj;
});
