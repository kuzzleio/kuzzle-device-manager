/* eslint-disable no-console */
import { createWriteStream, createReadStream, rename, existsSync } from "fs";
import { createInterface } from "readline";
import path from "path";
import { JSONObject } from "kuzzle-sdk";

const fileName = "documents.jsonl"; // Fichier d'entrée
const tempFileName = "temp-" + fileName;

export function transformDocuments(
  collection: string,
  indexPath: string,
  callBack: (string) => JSONObject,
  endCallBack?: () => void,
) {
  let error;
  const inputFilePath = path.join(indexPath, collection, fileName);

  const tempFilePath = path.join(indexPath, collection, tempFileName);
  if (!existsSync(inputFilePath)) {
    console.error("THE FILE DOESN'T EXIST at " + inputFilePath);
    return;
  }
  const readStream = createReadStream(inputFilePath);
  const writeStream = createWriteStream(tempFilePath);

  const rl = createInterface({
    input: readStream,
  });

  rl.on("line", (line) => {
    try {
      const doc = callBack(line);
      writeStream.write(JSON.stringify(doc) + "\n");
    } catch (err) {
      console.error("Error in " + collection);
      console.error(err);
      error = true;
    }
  });

  rl.on("close", () => {
    if (error) {
      return;
    }
    if (endCallBack) {
      endCallBack();
    }
    writeStream.end(() => {
      // Remplace l'ancien fichier par le nouveau

      rename(tempFilePath, inputFilePath, (err) => {
        if (err) {
          console.error(
            "Erreur lors du remplacement du fichier : " + collection,
            err,
          );
        } else {
          console.error("Fichier mis à jour avec succès");
        }
      });
    });
  });
}

export function clearProperties(obj, properties) {
  return Object.keys(obj)
    .filter((key) => !properties.includes(key))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}
export interface ModelRegistry {
  assets: {
    [key: string]: {
      type: string;
      name: string;
    }[];
  };
  devices: {
    [key: string]: {
      type: string;
      name: string;
    }[];
  };
}
export function retrieveModelMeasureSlots(
  pathToPlatformIndex: string,
  callBack: (models: ModelRegistry) => void,
) {
  const modelsPath = path.join(pathToPlatformIndex, "models", fileName);
  const readStream = createReadStream(modelsPath);

  const rl = createInterface({
    input: readStream,
  });
  const models: ModelRegistry = { assets: {}, devices: {} };
  rl.on("line", (line) => {
    try {
      const obj = JSON.parse(line);

      if (obj.body?.asset?.measures) {
        const model = obj.body.asset.model;
        models.assets[model] = [];
        models.assets[model].push(...obj.body.asset.measures);
      } else if (obj.body?.device?.measures) {
        const model = obj.body.device.model;
        models.devices[model] = [];
        models.devices[model].push(...obj.body.device.measures);
      }
    } catch (err) {
      console.error(err);
    }
  });

  rl.on("close", () => {
    callBack(models);
  });
}
