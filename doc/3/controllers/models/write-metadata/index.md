---
code: true
type: page
title: writeMetadata
description: Writes a metadata of the metadata referential
---

# writeMetadata

Creates a metadata of the metadata referential, or updates the details of an existing one.

The mappings of a new metadata are merged into the assets, devices and groups collections of every engine, used by a model or not. They are checked first against the inline metadata of the same name of every model, and against the actual mappings of these collections: mappings of deleted models or removed metadata stay in Elasticsearch.

If Elasticsearch rejects the mappings when the engines collections are updated (e.g. an unknown type), the request fails and the referential is restored.

The mappings of an existing metadata cannot be modified. Its `locales`, `editorHint`, `defaultValue` and `icon` can: they are copied into a model when it is written, the existing models are not modified.

See [Metadata Referential](../../../concepts/models/index.md#metadata-referential).

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/metadata/:name
Method: PUT
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "writeMetadata",
  "name": "<metadata name>",
  "body": {
    "mappings": {
      // Metadata mappings, e.g. { "type": "keyword" } or { "properties": { ... } }
    },

    // Optional

    "locales": {
      /*
        Default translations
          [locale: string]: {
            friendlyName: string;
            description: string;
          };
      */
    },
    "editorHint": {
      // Default editor hint: BaseEditorHint | OptionsSelectorDefinition | DatetimeEditorHint
    },
    "defaultValue": "<default value>",
    "icon": "<icon>" // Free-form string, e.g. a FontAwesome icon name, a URL to a PNG/SVG image, or inline SVG markup
  }
}
```

---

## Arguments

- `name`: metadata name. It cannot contain `.`

## Body properties

- `mappings`: metadata mappings
- `locales`: (optional) default translations
- `editorHint`: (optional) default editor hint
- `defaultValue`: (optional) default value
- `icon`: (optional) default icon, overridable by the models using the metadata

---

## Response

Returns the updated metadata referential.

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "writeMetadata",
  "requestId": "<unique request identifier>",
  "result": {
    "<metadata name>": {
      "mappings": { /* ... */ },
      "locales": { /* ... */ }
    }
  }
}
```

## Errors

- A [ BadRequestError ](https://docs.kuzzle.io/core/2/api/errors/types/#badrequesterror) (400) is thrown if the definition is invalid, if the mappings of an existing metadata are modified, or if the metadata is registered from code (`managed`). A `managed` field in the body is ignored
- A [ MappingsConflictsError ](../../../errors/mappings-conflicts/index.md) (409) is thrown if the mappings of a new metadata conflict with an inline metadata of a model or with the actual mappings of an engine collection
