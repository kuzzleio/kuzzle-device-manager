---
code: true
type: page
title: writeMetadata
description: Writes a metadata of the metadata referential
---

# writeMetadata

Creates or replaces a metadata of the metadata referential.

Every model referencing the metadata is resolved again, the engines mappings are updated and the digital twins of those models are refreshed.

The request is rejected with a `MappingsConflictsError` (409) if the new mappings conflict with the mappings of a model, including a model defining the same metadata inline.

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
- `icon`: (optional) default icon, overridable by the models referencing the metadata

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

- A [ BadRequestError ](https://docs.kuzzle.io/core/2/api/errors/types/#badrequesterror) (400) is thrown if the definition is invalid, or if the metadata is registered from code (`managed`). A `managed` field in the body is ignored
- A [ MappingsConflictsError ](../../../errors/mappings-conflicts/index.md) (409) is thrown if the new mappings conflict with the mappings of a model
