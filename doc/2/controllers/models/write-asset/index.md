---
code: true
type: page
title: writeAsset
description: Write an asset model
---

# writeAsset

Write an asset model.

This action acts like a create or replace

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/assets
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "writeAsset",
  "body": {
    "engineGroup": "<engine group>",
    "model": "<asset model>",

    // Optional

    "metadataMappings": {
      // Metadata mappings
    },
    "defaultValues": {
      // Default values for metadata
    },
    "metadataDetails": {
      /*
        Metadata details including tanslations and group.
          [name: string]: {
            group?: string;
            locales: {
              [locale: string]: {
                friendlyName: string;
                description: string;
              };
            };
          };
      */
    },
    "metadataGroups"; {
    /*
      Metadata groups list and details.
        {
          [groupName: string]: {
            locales: {
              [locale: string]: {
                groupFriendlyName: string;
                description: string;
              };
            };
          };
        };
    */
    },
    "measures": [
      // Array of measure definition with type and name
    ]
  }
}
```

---

## Body properties

- `engineGroup`: Name of the engine group
- `model`: Asset model name
- `metadataMappings`: Mappings of the metadata in Elasticsearch format
- `defaultValues`: Default values for the metadata
- `metadataDetails`: Metadata group and translations
- `metadataGroups`: Groups list with translations for group name 
- `measures`: Array of measure definition. Each item define a `type` and `name` properties for the measure.

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "writeAsset",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<modelId>",
    "_source": {
      // Asset model content
    },
  }
}
```

## Errors

Writing an asset with metadata mappings can cause conflicts, in this case a [ MappingsConflictsError ](../../../errors/mappings-conflicts/index.md) will be thrown with the HTTP code **409**.