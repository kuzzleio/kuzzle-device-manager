import { EmbeddedSDK } from "kuzzle";
import { JSONObject, KDocument } from "kuzzle-sdk";
import _ from "lodash";

import { InternalCollection } from "../plugin/types/InternalCollection";
import { lock } from "../shared/utils/lock";

import { MappingsConflictsError } from "./MappingsConflictsError";
import {
  ConflictChunk,
  MappingsConflict,
  findMappingsConflicts,
} from "./ModelsConflicts";
import {
  AssetModelContent,
  DeviceModelContent,
  GroupModelContent,
  LocaleDetails,
  MetadataDetails,
  MetadataMappings,
  MetadataReferential,
  MetadataReferentialContent,
  MetadataReferentialEntry,
  ReferentialMetadataMapping,
  ResolvedMetadataMappings,
} from "./types/ModelContent";

export const METADATA_REFERENTIAL_ID = "model-metadata-referential";

/**
 * TTL of the metadata referential lock. Kuzzle locks expire after 5s by default,
 * less than a model write updating the engines collections.
 */
const METADATA_REFERENTIAL_LOCK_TTL = 120_000;

/**
 * Runs cb holding the metadata referential lock, taken by every write of the referential
 * and of asset, device and group models, so their conflicts checks see each other writes
 */
export async function withMetadataReferentialLock<T>(
  cb: () => Promise<T>,
): Promise<T> {
  return lock("device-manager/metadataReferential", cb, {
    ttl: METADATA_REFERENTIAL_LOCK_TTL,
  });
}

export type MetadataModelContent =
  | AssetModelContent
  | DeviceModelContent
  | GroupModelContent;

export type MetadataModelType = MetadataModelContent["type"];

/**
 * Metadata related fields of an asset, device or group model
 */
export type ModelMetadataFields = {
  metadataMappings: MetadataMappings;
  defaultMetadata: JSONObject;
  metadataDetails: MetadataDetails;
};

export type MetadataResolutionContext = {
  modelType: MetadataModelType;
  model: string;
  /**
   * Builds the error thrown on an invalid use of the referential.
   * PluginImplementationError when registering from code, BadRequestError from the API.
   */
  createError: (message: string) => Error;
};

export type MetadataEnrichment = {
  /**
   * Metadata fields to store: referential markers are kept in metadataMappings,
   * metadataDetails and defaultMetadata are enriched with the referential values
   */
  fields: ModelMetadataFields;
  /**
   * Metadata mappings with the referential markers replaced by the referential mappings
   */
  resolvedMappings: ResolvedMetadataMappings;
  /**
   * Inline metadata identical to a referential entry, which should use the referential instead
   */
  warnings: string[];
};

/**
 * @returns true if the metadata mappings mark a metadata of the referential
 */
export function isReferentialMapping(
  mapping: unknown,
): mapping is ReferentialMetadataMapping {
  return (
    _.isPlainObject(mapping) && (mapping as JSONObject).referential === true
  );
}

/**
 * Lists the metadata of a model coming from the metadata referential
 */
export function getReferentialNames(
  metadataMappings: MetadataMappings = {},
): string[] {
  return Object.keys(metadataMappings).filter((name) =>
    isReferentialMapping(metadataMappings[name]),
  );
}

/**
 * Replaces the referential markers of metadata mappings by the referential mappings.
 * A marker of a metadata missing from the referential is dropped.
 */
export function resolveMetadataMappings(
  referential: MetadataReferential,
  metadataMappings: MetadataMappings = {},
): ResolvedMetadataMappings {
  const resolved: ResolvedMetadataMappings = {};

  for (const [name, mapping] of Object.entries(metadataMappings)) {
    if (!isReferentialMapping(mapping)) {
      resolved[name] = mapping;
    } else if (referential[name]) {
      resolved[name] = _.cloneDeep(referential[name].mappings);
    }
  }

  return resolved;
}

/**
 * @returns The model with the referential markers of its metadata mappings resolved
 */
export function resolveModelMappings<T extends MetadataModelContent>(
  referential: MetadataReferential,
  content: T,
): T {
  const twin = content[content.type];

  return {
    ...content,
    [content.type]: {
      ...twin,
      metadataMappings: resolveMetadataMappings(
        referential,
        twin.metadataMappings,
      ),
    },
  };
}

function isDefaultOf(key: string, name: string) {
  return key === name || key.startsWith(`${name}.`);
}

/**
 * Merges, per locale, the model translations over the referential ones.
 * A locale missing from the referential falls back to the metadata name and an empty description.
 */
function mergeLocales(
  name: string,
  entryLocales: MetadataReferentialEntry["locales"] = {},
  modelLocales: MetadataDetails[string]["locales"] = {},
): { [locale: string]: LocaleDetails } {
  const locales: { [locale: string]: LocaleDetails } = {};

  for (const locale of _.union(
    Object.keys(entryLocales),
    Object.keys(modelLocales),
  )) {
    locales[locale] = {
      description: "",
      friendlyName: name,
      ...entryLocales[locale],
      ...modelLocales[locale],
    };
  }

  return locales;
}

/**
 * Builds the details of a metadata of the referential, the model values taking precedence
 */
function enrichDetails(
  name: string,
  entry: MetadataReferentialEntry,
  details: Partial<MetadataDetails[string]> = {},
): MetadataDetails[string] {
  return {
    ...(entry.editorHint ? { editorHint: _.cloneDeep(entry.editorHint) } : {}),
    ...(entry.icon !== undefined ? { icon: entry.icon } : {}),
    ...details,
    locales: mergeLocales(name, entry.locales, details.locales),
  };
}

/**
 * Fills the details and default value of a referential metadata with the referential values,
 * the model values taking precedence
 */
function applyReferentialValues(
  name: string,
  entry: MetadataReferentialEntry,
  metadataDetails: MetadataDetails,
  defaultMetadata: JSONObject,
) {
  metadataDetails[name] = enrichDetails(name, entry, metadataDetails[name]);

  const hasDefault = Object.keys(defaultMetadata).some((key) =>
    isDefaultOf(key, name),
  );

  if (!hasDefault && entry.defaultValue !== undefined) {
    defaultMetadata[name] = _.cloneDeep(entry.defaultValue);
  }
}

/**
 * Resolves the referential metadata of a stored model, to be read:
 * the markers are replaced by the referential mappings, the details and default values
 * are merged over the current referential values.
 * A marker of a metadata missing from the referential is dropped.
 *
 * @returns The model with its referential metadata resolved
 */
export function resolveModelMetadata<T extends MetadataModelContent>(
  referential: MetadataReferential,
  content: T,
): T {
  const twin = content[content.type];
  const metadataDetails: MetadataDetails = { ...twin.metadataDetails };
  const defaultMetadata: JSONObject = { ...twin.defaultMetadata };

  for (const name of getReferentialNames(twin.metadataMappings)) {
    if (referential[name]) {
      applyReferentialValues(
        name,
        referential[name],
        metadataDetails,
        defaultMetadata,
      );
    }
  }

  return {
    ...content,
    [content.type]: {
      ...twin,
      defaultMetadata,
      metadataDetails,
      metadataMappings: resolveMetadataMappings(
        referential,
        twin.metadataMappings,
      ),
    },
  };
}

/**
 * Validates the shape of a metadata referential entry
 *
 * @throws The error built by createError if the entry is invalid
 */
export function checkMetadataReferentialEntry(
  name: string,
  entry: MetadataReferentialEntry,
  createError: (message: string) => Error,
) {
  if (typeof name !== "string" || name.length === 0 || name.includes(".")) {
    throw createError(
      `Metadata name "${name}" is invalid: it must be a non empty string without "."`,
    );
  }

  if (!_.isPlainObject(entry)) {
    throw createError(`Metadata "${name}" definition must be an object`);
  }

  const mappings = entry.mappings as JSONObject;

  if (
    !_.isPlainObject(mappings) ||
    (typeof mappings.type !== "string" && !_.isPlainObject(mappings.properties))
  ) {
    throw createError(
      `Metadata "${name}" mappings must define either a "type" or "properties"`,
    );
  }

  if (entry.locales !== undefined && !_.isPlainObject(entry.locales)) {
    throw createError(`Metadata "${name}" locales must be an object`);
  }

  if (
    entry.editorHint !== undefined &&
    (!_.isPlainObject(entry.editorHint) ||
      typeof entry.editorHint.type !== "string")
  ) {
    throw createError(
      `Metadata "${name}" editorHint must be an object with a "type"`,
    );
  }

  if (entry.icon !== undefined && typeof entry.icon !== "string") {
    throw createError(`Metadata "${name}" icon must be a string`);
  }
}

/**
 * Lists the conflicts between an inline metadata and a referential entry of the same name.
 * Any difference is a conflict: an inline metadata must be identical to the referential one.
 */
function getInlineConflicts(
  name: string,
  inlineMappings: unknown,
  entry: MetadataReferentialEntry,
  basePath: string,
): MappingsConflict[] {
  if (_.isEqual(inlineMappings, entry.mappings)) {
    return [];
  }

  const conflicts = findMappingsConflicts(
    { [name]: entry.mappings },
    { [name]: inlineMappings },
    basePath,
  );

  // ? Same leaves but different structure (e.g. additional properties)
  if (conflicts.length === 0) {
    return [
      {
        currentType: JSON.stringify(entry.mappings),
        newType: JSON.stringify(inlineMappings),
        path: `${basePath}.${name}`,
      },
    ];
  }

  return conflicts;
}

function describeModel(context: MetadataResolutionContext) {
  return `${context.modelType} model "${context.model}"`;
}

/**
 * Validates the metadata mappings of a model against the metadata referential and enriches
 * the details and default values of the metadata coming from the referential.
 *
 * A metadata of the referential is marked `{ referential: true }` in metadataMappings, the marker is kept.
 * Its details are the referential locales (merged per locale), editorHint and icon, overridden by the
 * model ones. Its default value is the referential one, unless the model defines one.
 *
 * An inline metadata with the name of a referential entry must have the same mappings (legacy).
 *
 * @throws The error built by createError on an invalid marker or an unknown metadata
 * @throws MappingsConflictsError if an inline metadata conflicts with the referential
 */
export function enrichModelMetadata(
  referential: MetadataReferential,
  fields: Partial<ModelMetadataFields>,
  context: MetadataResolutionContext,
): MetadataEnrichment {
  const model = describeModel(context);
  const metadataMappings = fields.metadataMappings ?? {};
  const metadataDetails: MetadataDetails = { ...fields.metadataDetails };
  const defaultMetadata: JSONObject = { ...fields.defaultMetadata };
  const warnings: string[] = [];
  const conflicts: MappingsConflict[] = [];

  if (!_.isPlainObject(metadataMappings)) {
    throw context.createError(
      `Metadata mappings of ${model} must be an object`,
    );
  }

  for (const [name, mapping] of Object.entries(metadataMappings)) {
    const entry = referential[name];

    if (_.isPlainObject(mapping) && "referential" in mapping) {
      if (!isReferentialMapping(mapping) || Object.keys(mapping).length !== 1) {
        throw context.createError(
          `The metadata "${name}" of ${model} must be { referential: true } to use the metadata referential`,
        );
      }

      if (!entry) {
        throw context.createError(
          `The ${model} uses the unknown referential metadata "${name}"`,
        );
      }

      applyReferentialValues(name, entry, metadataDetails, defaultMetadata);

      continue;
    }

    if (!entry) {
      continue;
    }

    conflicts.push(
      ...getInlineConflicts(
        name,
        mapping,
        entry,
        `${context.modelType}.metadataMappings`,
      ),
    );

    warnings.push(
      `The ${model} defines the metadata "${name}" inline, it should use the metadata referential instead with { referential: true }`,
    );
  }

  if (conflicts.length > 0) {
    throw new MappingsConflictsError(
      `Metadata of ${model} conflict with the metadata referential`,
      [
        {
          conflicts,
          modelType: context.modelType,
          newModel: context.model,
          sourceModel: "metadata-referential",
        },
      ],
    );
  }

  return {
    fields: { defaultMetadata, metadataDetails, metadataMappings },
    resolvedMappings: resolveMetadataMappings(referential, metadataMappings),
    warnings,
  };
}

/**
 * Lists the conflicts between a referential entry and the inline metadata of the same name of models
 */
export function getEntryModelsConflicts(
  name: string,
  entry: MetadataReferentialEntry,
  models: MetadataModelContent[],
): ConflictChunk[] {
  const chunks: ConflictChunk[] = [];

  for (const content of models) {
    const twin = content[content.type];
    const mapping = twin.metadataMappings?.[name];

    if (mapping === undefined || isReferentialMapping(mapping)) {
      continue;
    }

    const conflicts = getInlineConflicts(
      name,
      mapping,
      entry,
      `${content.type}.metadataMappings`,
    );

    if (conflicts.length > 0) {
      chunks.push({
        conflicts,
        modelType: content.type,
        newModel: "metadata-referential",
        sourceModel: twin.model,
      });
    }
  }

  return chunks;
}

/**
 * Lists the inline metadata a model write adds: metadataMappings keys that neither
 * use the referential nor are already defined inline by the stored model.
 */
export function getAddedInlineMetadata(
  metadataMappings: MetadataMappings,
  stored: MetadataModelContent | null,
): string[] {
  const storedMappings = stored?.[stored.type]?.metadataMappings ?? {};

  return Object.keys(metadataMappings).filter(
    (name) =>
      !isReferentialMapping(metadataMappings[name]) &&
      !(name in storedMappings && !isReferentialMapping(storedMappings[name])),
  );
}

/**
 * Reads the metadata referential document
 *
 * @returns The referential metadata, empty if the document does not exist yet
 */
export async function fetchMetadataReferential(
  sdk: EmbeddedSDK,
  platformIndex: string,
): Promise<MetadataReferential> {
  try {
    const document = await sdk.document.get<MetadataReferentialContent>(
      platformIndex,
      InternalCollection.MODELS,
      METADATA_REFERENTIAL_ID,
    );

    return document._source.metadata ?? {};
  } catch (error) {
    if (error.status === 404) {
      return {};
    }

    throw error;
  }
}

/**
 * Writes the whole metadata referential document
 */
export async function saveMetadataReferential(
  sdk: EmbeddedSDK,
  platformIndex: string,
  referential: MetadataReferential,
) {
  const content: MetadataReferentialContent = {
    metadata: referential,
    type: "metadata-referential",
  };

  return sdk.document.createOrReplace<MetadataReferentialContent>(
    platformIndex,
    InternalCollection.MODELS,
    METADATA_REFERENTIAL_ID,
    content,
    { refresh: "wait_for" },
  );
}

/**
 * Lists every stored asset, device and group model
 */
export async function fetchMetadataModels(
  sdk: EmbeddedSDK,
  platformIndex: string,
): Promise<KDocument<MetadataModelContent>[]> {
  const models: KDocument<MetadataModelContent>[] = [];

  let result = await sdk.document.search<MetadataModelContent>(
    platformIndex,
    InternalCollection.MODELS,
    { query: { terms: { type: ["asset", "device", "group"] } } },
    { lang: "elasticsearch", scroll: "10s", size: 500 },
  );

  while (result) {
    for (const hit of result.hits) {
      models.push({ _id: hit._id, _source: hit._source });
    }

    result = await result.next();
  }

  return models;
}

/**
 * Lists every stored asset, device and group model using the given metadata of the referential.
 *
 * metadataMappings is not indexed, the filtering is done after fetching the models.
 */
export async function fetchReferencingModels(
  sdk: EmbeddedSDK,
  platformIndex: string,
  name: string,
): Promise<KDocument<MetadataModelContent>[]> {
  const models = await fetchMetadataModels(sdk, platformIndex);

  return models.filter(({ _source }) =>
    isReferentialMapping(_source[_source.type]?.metadataMappings?.[name]),
  );
}
