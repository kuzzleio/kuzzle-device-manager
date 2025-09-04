#!/usr/bin/env node
import { transformDocuments, clearProperties } from "./utils.js";

const args: any = {};
for (let index = 0; index < process.argv.length; index++) {
  const val = process.argv[index];
  if (val.startsWith("--")) {
    const [key, value] = val.replace("--", "").split("=");
    args[key] = value || true;
  }
}

const pathToPlatformIndex =
  args["platform-index"] || process.env.PLATFORM_INDEX;

if (!pathToPlatformIndex) {
  throw new Error(
    "PLATFORM_INDEX env variable or --platform-index is required",
  );
}
// eslint-disable-next-line no-console
console.info("MIGRATING " + pathToPlatformIndex);

// DEVICES
transformDocuments("devices", pathToPlatformIndex, (line) => {
  const propertiesToDelete = [
    "assetId",
    "metadata",
    "measures",
    "groups",
    "lastMeasuredAt",
  ];
  const obj = JSON.parse(line);
  // Check line is a document
  if (obj.body) {
    obj.body = clearProperties(obj.body, propertiesToDelete);
    const createdAt = obj.body._kuzzle_info?.createdAt;
    if (createdAt) {
      obj.body.provisionedAt = createdAt;
    }
  }
  return obj;
});

// MODELS
transformDocuments("models", pathToPlatformIndex, (line) => {
  const obj = JSON.parse(line);
  // Check line is a document
  if (obj.body && obj.body.group) {
    obj.body.group.affinity = {
      models: {
        assets: [],
        devices: [],
      },
      strict: false,
      type: ["assets", "devices"],
    };
  }
  return obj;
});
