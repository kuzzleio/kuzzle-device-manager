import { EmbeddedSDK } from "kuzzle";
import { JSONObject, KDocument } from "kuzzle-sdk";
import _ from "lodash";

import { InternalCollection } from "../plugin/types/InternalCollection";

import { MappingsConflictsError } from "./MappingsConflictsError";
import { MappingsConflict, findConflicts } from "./ModelsConflicts";
import {
  AssetModelContent,
  DeviceModelContent,
  GroupModelContent,
  LocaleDetails,
  MetadataDetails,
  MetadataMappings,
  MetadataReference,
  MetadataReferential,
  MetadataReferentialContent,
  MetadataReferentialEntry,
  MetadataReferences,
} from "./types/ModelContent";

export const METADATA_REFERENTIAL_ID = "model-metadata-referential";

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
  metadataReferences: MetadataReferences;
};

export type MetadataResolutionContext = {
  modelType: MetadataModelType;
  model: string;
  /**
   * Builds the error thrown on an invalid reference.
   * PluginImplementationError when registering from code, BadRequestError from the API.
   */
  createError: (message: string) => Error;
};

export type MetadataResolution = {
  fields: ModelMetadataFields;
  /**
   * Inline metadata identical to a referential entry, which should be referenced instead
   */
  warnings: string[];
  /**
   * Inline details or default values of a referenced metadata, which differ from the resolved ones
   * and are therefore ignored
   */
  ignored: string[];
};

function isDefaultOf(key: string, name: string) {
  return key === name || key.startsWith(`${name}.`);
}

function omitDefaultsOf(defaultMetadata: JSONObject, names: string[]) {
  return _.omitBy(defaultMetadata, (_value, key) =>
    names.some((name) => isDefaultOf(key, name)),
  );
}

/**
 * Merges, per locale, the reference translations over the referential ones.
 * A locale missing from the referential falls back to the metadata name and an empty description.
 */
function mergeLocales(
  name: string,
  entryLocales: MetadataReferentialEntry["locales"],
  referenceLocales: Exclude<MetadataReference, true>["locales"] = {},
): { [locale: string]: LocaleDetails } {
  const locales: { [locale: string]: LocaleDetails } = {};

  for (const locale of _.union(
    Object.keys(entryLocales ?? {}),
    Object.keys(referenceLocales),
  )) {
    locales[locale] = {
      description: "",
      friendlyName: name,
      ...entryLocales?.[locale],
      ...referenceLocales[locale],
    };
  }

  return locales;
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
 * Checks that an inline metadata does not redefine a referential entry differently
 *
 * @returns true if the inline metadata is identical to the referential entry
 * @throws MappingsConflictsError if the inline mappings differ from the referential ones
 */
function checkInlineMetadata(
  name: string,
  inlineMappings: MetadataMappings[string],
  entry: MetadataReferentialEntry,
  context: MetadataResolutionContext,
) {
  if (_.isEqual(inlineMappings, entry.mappings)) {
    return true;
  }

  let conflicts: MappingsConflict[] = findConflicts(
    entry.mappings,
    inlineMappings,
    name,
  );

  // ? Same leaves but different structure (e.g. additional properties)
  if (conflicts.length === 0) {
    conflicts = [
      {
        currentType: JSON.stringify(entry.mappings),
        newType: JSON.stringify(inlineMappings),
        path: name,
      },
    ];
  }

  throw new MappingsConflictsError(
    `Metadata "${name}" of ${context.modelType} model "${context.model}" conflicts with the metadata referential`,
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

function describeModel(context: MetadataResolutionContext) {
  return `${context.modelType} model "${context.model}"`;
}

/**
 * Validates the metadata references of a model against the metadata referential
 *
 * @throws The error built by createError on an unknown or invalid reference
 */
function checkMetadataReferences(
  referential: MetadataReferential,
  references: MetadataReferences,
  context: MetadataResolutionContext,
) {
  const model = describeModel(context);

  if (!_.isPlainObject(references)) {
    throw context.createError(
      `Metadata references of ${model} must be an object`,
    );
  }

  for (const [name, reference] of Object.entries(references)) {
    if (!referential[name]) {
      throw context.createError(
        `The ${model} references the unknown metadata "${name}"`,
      );
    }

    if (reference === true) {
      continue;
    }

    if (!_.isPlainObject(reference)) {
      throw context.createError(
        `The reference to metadata "${name}" of ${model} must be true or an object`,
      );
    }

    if (reference.icon !== undefined && typeof reference.icon !== "string") {
      throw context.createError(
        `The icon of the reference to metadata "${name}" of ${model} must be a string`,
      );
    }
  }
}

/**
 * Keeps the inline metadata mappings that are not referenced, checking them against the referential
 *
 * @throws MappingsConflictsError if an inline metadata conflicts with the referential
 */
function resolveInlineMappings(
  referential: MetadataReferential,
  inlineMappings: MetadataMappings,
  referencedNames: string[],
  context: MetadataResolutionContext,
  warnings: string[],
): MetadataMappings {
  const metadataMappings: MetadataMappings = {};

  for (const [name, mappings] of Object.entries(inlineMappings)) {
    const entry = referential[name];

    if (entry) {
      checkInlineMetadata(name, mappings, entry, context);
    }

    // ? An identical inline copy of a referenced metadata is a previously resolved model
    if (entry && referencedNames.includes(name)) {
      continue;
    }

    metadataMappings[name] = mappings;

    if (entry) {
      warnings.push(
        `The ${describeModel(context)} defines the metadata "${name}" inline, it should reference it from the metadata referential instead`,
      );
    }
  }

  return metadataMappings;
}

/**
 * Builds the details of a referenced metadata, the reference values taking precedence
 */
function resolveReferenceDetails(
  name: string,
  entry: MetadataReferentialEntry,
  reference: Exclude<MetadataReference, true>,
): MetadataDetails[string] {
  const icon = reference.icon ?? entry.icon;

  return {
    locales: mergeLocales(name, entry.locales, reference.locales),
    ...(entry.editorHint ? { editorHint: _.cloneDeep(entry.editorHint) } : {}),
    ...(reference.group ? { group: reference.group } : {}),
    ...(icon !== undefined ? { icon } : {}),
  };
}

/**
 * Lists the inline values of a referenced metadata that differ from the resolved ones
 */
function listIgnoredInlineValues(
  name: string,
  fields: Partial<ModelMetadataFields>,
  resolvedDetails: MetadataDetails[string],
  defaultValue: unknown,
  context: MetadataResolutionContext,
): string[] {
  const ignored: string[] = [];
  const model = describeModel(context);

  // ? Identical inline values are a previously resolved model, different ones are lost
  const inlineDetails = fields.metadataDetails?.[name];

  if (
    inlineDetails !== undefined &&
    !_.isEqual(inlineDetails, resolvedDetails)
  ) {
    ignored.push(
      `The inline details of the referenced metadata "${name}" of ${model} differ from the resolved ones, use the reference locales, group and icon instead`,
    );
  }

  const resolvedDefaults =
    defaultValue === undefined ? {} : { [name]: defaultValue };
  const hasIgnoredDefaults = Object.entries(fields.defaultMetadata ?? {}).some(
    ([key, value]) =>
      isDefaultOf(key, name) && !_.isEqual(value, _.get(resolvedDefaults, key)),
  );

  if (hasIgnoredDefaults) {
    ignored.push(
      `The inline default value of the referenced metadata "${name}" of ${model} differs from the resolved one, use the reference defaultValue instead`,
    );
  }

  return ignored;
}

/**
 * Resolves the metadata references of a model against the metadata referential.
 *
 * Referenced metadata are materialized into metadataMappings, metadataDetails and defaultMetadata,
 * so the rest of the plugin (engine mappings, conflicts, twins refresh) keeps working on
 * fully defined models. Inline metadata are kept as is (legacy behaviour).
 *
 * For a referenced metadata, the referential definition always wins: inline details and
 * default values for that name that differ from the resolved ones are reported in `ignored`,
 * use the reference locales, group, defaultValue and icon instead.
 *
 * @throws The error built by createError on an unknown or invalid reference
 * @throws MappingsConflictsError if an inline metadata conflicts with the referential
 */
export function resolveMetadataReferences(
  referential: MetadataReferential,
  fields: Partial<ModelMetadataFields>,
  context: MetadataResolutionContext,
): MetadataResolution {
  const references = fields.metadataReferences ?? {};
  const warnings: string[] = [];
  const ignored: string[] = [];

  checkMetadataReferences(referential, references, context);

  const referencedNames = Object.keys(references);
  const metadataMappings = resolveInlineMappings(
    referential,
    fields.metadataMappings ?? {},
    referencedNames,
    context,
    warnings,
  );
  const metadataDetails: MetadataDetails = _.omit(
    fields.metadataDetails ?? {},
    referencedNames,
  );
  const defaultMetadata: JSONObject = omitDefaultsOf(
    fields.defaultMetadata ?? {},
    referencedNames,
  );

  for (const name of referencedNames) {
    const entry = referential[name];
    const rawReference = references[name];
    const reference: Exclude<MetadataReference, true> =
      rawReference === true ? {} : rawReference;

    metadataMappings[name] = _.cloneDeep(entry.mappings);
    metadataDetails[name] = resolveReferenceDetails(name, entry, reference);

    const defaultValue =
      reference.defaultValue !== undefined
        ? reference.defaultValue
        : entry.defaultValue;

    if (defaultValue !== undefined) {
      defaultMetadata[name] = _.cloneDeep(defaultValue);
    }

    ignored.push(
      ...listIgnoredInlineValues(
        name,
        fields,
        metadataDetails[name],
        defaultValue,
        context,
      ),
    );
  }

  return {
    fields: {
      defaultMetadata,
      metadataDetails,
      metadataMappings,
      metadataReferences: references,
    },
    ignored,
    warnings,
  };
}

/**
 * Returns the metadata fields of a stored model, without the resolved referenced metadata.
 * This is the input to give back to resolveMetadataReferences to resolve the model again.
 */
export function getInlineMetadataFields(
  content: MetadataModelContent,
): ModelMetadataFields {
  const twin = content[content.type];
  const references = twin.metadataReferences ?? {};
  const referencedNames = Object.keys(references);

  return {
    defaultMetadata: omitDefaultsOf(
      twin.defaultMetadata ?? {},
      referencedNames,
    ),
    metadataDetails: _.omit(twin.metadataDetails ?? {}, referencedNames),
    metadataMappings: _.omit(twin.metadataMappings ?? {}, referencedNames),
    metadataReferences: references,
  };
}

/**
 * Lists the inline metadata a model write adds: inline metadataMappings keys that are
 * neither referenced nor already defined inline by the stored model.
 */
export function getAddedInlineMetadata(
  metadataMappings: MetadataMappings,
  metadataReferences: MetadataReferences,
  stored: MetadataModelContent | null,
): string[] {
  const storedInline = stored
    ? Object.keys(getInlineMetadataFields(stored).metadataMappings)
    : [];

  return Object.keys(metadataMappings).filter(
    (name) => !(name in metadataReferences) && !storedInline.includes(name),
  );
}

/**
 * Resolves a model registered from code against the metadata referential.
 * Its metadata fields are taken as registered, so inline values ignored for a reference are reported.
 *
 * @returns The model content with resolved metadata fields
 */
export function resolveModel<T extends MetadataModelContent>(
  referential: MetadataReferential,
  content: T,
  createError: (message: string) => Error,
): MetadataResolution & { content: T } {
  return resolveModelFields(
    referential,
    content,
    content[content.type],
    createError,
  );
}

/**
 * Resolves again a stored model against the metadata referential
 *
 * @returns The model content with resolved metadata fields
 */
export function reResolveModel<T extends MetadataModelContent>(
  referential: MetadataReferential,
  content: T,
  createError: (message: string) => Error,
): MetadataResolution & { content: T } {
  return resolveModelFields(
    referential,
    content,
    getInlineMetadataFields(content),
    createError,
  );
}

function resolveModelFields<T extends MetadataModelContent>(
  referential: MetadataReferential,
  content: T,
  fields: Partial<ModelMetadataFields>,
  createError: (message: string) => Error,
): MetadataResolution & { content: T } {
  const twin = content[content.type];
  const resolution = resolveMetadataReferences(referential, fields, {
    createError,
    model: twin.model,
    modelType: content.type,
  });

  return {
    ...resolution,
    content: {
      ...content,
      [content.type]: { ...twin, ...resolution.fields },
    },
  };
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
 * Lists every stored asset, device and group model referencing at least one of the given metadata.
 * Without names, lists every model referencing the metadata referential.
 *
 * metadataReferences is not indexed, the filtering is done after fetching the models.
 */
export async function fetchReferencingModels(
  sdk: EmbeddedSDK,
  platformIndex: string,
  names?: string[],
): Promise<KDocument<MetadataModelContent>[]> {
  const models = await fetchMetadataModels(sdk, platformIndex);

  return models.filter(({ _source }) => {
    const referencedNames = Object.keys(
      _source[_source.type]?.metadataReferences ?? {},
    );

    return names
      ? referencedNames.some((name) => names.includes(name))
      : referencedNames.length > 0;
  });
}
