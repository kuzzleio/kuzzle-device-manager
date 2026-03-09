import _ from "lodash";
import { TwinModelContent, TwinType } from "../plugin";
import {
  GroupModelContent,
  MeasureModelContent,
  ModelContent,
} from "./exports";

export type ConflictChunk = {
  sourceModel: string;
  newModel: string;
  modelType: string;
  conflicts: MappingsConflict[];
};

export type MappingsConflict = {
  path: string;
  currentType: string | undefined;
  newType: string | undefined;
};

/**
 * Return every conflicts between the mappings of models and a new model
 *
 * @param modelType The target model type
 * @param models The already present models used as comparison source
 * @param additional  The new model
 * @param mappingsPath The object path to the mappings
 * @param modelIdPath The object path to the model ID
 * @returns An array of ConflictChunk between current models and the new model
 */
function getModelConflicts(
  modelType: string,
  models: ModelContent[],
  additional: ModelContent,
  mappingsPath: string,
  modelIdPath: string,
) {
  const conflicts: ConflictChunk[] = [];

  for (const model of models) {
    const baseMappings = _.get(model, mappingsPath);
    const updatedMappings = JSON.parse(JSON.stringify(baseMappings));

    _.merge(updatedMappings, _.get(additional, mappingsPath));

    const mappingsConflict = findConflicts(
      baseMappings,
      updatedMappings,
      mappingsPath,
    );

    if (mappingsConflict.length > 0) {
      conflicts.push({
        conflicts: mappingsConflict,
        modelType: modelType,
        newModel: _.get(additional, modelIdPath),
        sourceModel: _.get(model, modelIdPath),
      });
    }
  }

  return conflicts;
}

/**
 * Return every conflicts between the mappings of twins and a new twin model
 *
 * @param twinType The target twin type
 * @param models The already present twin models
 * @param additional The new asset
 * @returns An array of ConflictChunk between current twins and the new twin
 */
export function getTwinConflicts<TDigitalTwin extends TwinModelContent>(
  twinType: TwinType,
  models: TDigitalTwin[],
  additional: TDigitalTwin,
): ConflictChunk[] {
  const metadataPath = twinType + ".metadataMappings";
  const modelIdPath = twinType + ".model";

  return getModelConflicts(
    twinType,
    models,
    additional,
    metadataPath,
    modelIdPath,
  );
}
/**
 * Return every conflicts between the mappings of group models and a new group model
 *
 * @param groups The already present group models
 * @param additional The new group model
 * @returns An array of ConflictChunk between current groups and the new group
 */
export function getGroupConflicts(
  measures: GroupModelContent[],
  additional: GroupModelContent,
): ConflictChunk[] {
  const modelType = "group";
  const mappingsPath = "group.metadataMappings";
  const modelIdPath = "group.model";

  return getModelConflicts(
    modelType,
    measures,
    additional,
    mappingsPath,
    modelIdPath,
  );
}

/**
 * Return every conflicts between the mappings of measure models and a new measure model
 *
 * @param measures The already present measure models
 * @param additional The new measure
 * @returns An array of ConflictChunk between current measures and the new measure
 */
export function getMeasureConflicts(
  measures: MeasureModelContent[],
  additional: MeasureModelContent,
): ConflictChunk[] {
  const modelType = "measure";
  const mappingsPath = "measure.valuesMappings";
  const modelIdPath = "measure.type";

  return getModelConflicts(
    modelType,
    measures,
    additional,
    mappingsPath,
    modelIdPath,
  );
}

/**
 * Find every conflicts between two objects.
 * WARNING: "undefined" type of conflicts are not registered
 * @param sourceObject The source object used to compare
 * @param objectToCompare The target object to compare to
 * @param basePath Optional path to be added before conflicts paths
 * @returns An array of MappingsConflict
 */
function findConflicts(sourceObject: any, objectToCompare: any, basePath = "") {
  if (sourceObject === objectToCompare) {
    return [];
  }

  if (_.isEqual(sourceObject, objectToCompare)) {
    return [];
  }

  const conflicts: MappingsConflict[] = [];

  function compareObjects(source: any, toCompare: any, path = "") {
    //Loop over the source object properties of distinct depth level
    _.forOwn(source, (value, key) => {
      //Construct full path from the previous path and the current key
      const fullPath = path ? `${path}.${key}` : key;

      //Check the object to compare key availibility, if there's nothing return to continue on the next property
      if (!_.has(toCompare, key)) {
        return;
      }

      //If the property to compare is an object, recursively call the method to advance on the next depth level
      if (_.isObject(value) && _.isObject(toCompare[key])) {
        compareObjects(value, toCompare[key], fullPath);
        return;
      }

      //If the property to compare is not an object and is not equal to the source value, add the current/new value with it's corresponding full path
      if (!_.isEqual(value, toCompare[key])) {
        conflicts.push({
          currentType: source[key],
          newType: toCompare[key],
          path: fullPath,
        });
      }
    });
  }

  compareObjects(sourceObject, objectToCompare, basePath);
  return conflicts;
}
