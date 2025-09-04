---
code: true
type: page
title: writeGroup
description: Write a group model
---

# writeGroup

Write a group model.

This action acts like a create or replace.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/groups
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "writeGroup",
  "body": {
    "engineGroup": "<engine group>",
    "model": "<group model>",

    // Required
    "affinity": {
      "type": ["assets", "devices"], // Array of accepted types
      "models": {
        "assets": ["AssetModelA", "AssetModelB"], // Accepted asset models
        "devices": ["DeviceModelA"] // Accepted device models
      },
      "strict": false // If true, restricts group membership to specified types/models
    },

    // Optional
    "metadataMappings": {
      // Metadata mappings
    },
    "defaultValues": {
      // Default values for metadata
    },
    "metadataDetails": {
      /*
        Metadata details including translations, group and editor hint.
          [name: string]: {
            group?: string;
            locales: {
              [locale: string]: {
                friendlyName: string;
                description: string;
              };
            };
            editorHint?: BaseEditorHint | OptionsSelectorDefinition | DatetimeEditorHint;
          };
      */
    },
    "metadataGroups": {
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
    "tooltipModels": {
      /*
        Tooltip models for a group model.
          [key: string]: {
            tooltipLabel: string;
            content: [
              {
                category: "metadata";
                label?: {
                  locales: {
                    [locale: string]: {
                      friendlyName: string;
                      description: string;
                    };
                  };
                };
                metadataPath: string;
                suffix?: string;
              },
              {
                category: "measure";
                label?: {
                  locales: {
                    [locale: string]: {
                      friendlyName: string;
                      description: string;
                    };
                  };
                };
                measureSlot: string;
                measureValuePath: string;
                suffix?: string;
              },
              {
                category: "static";
                label?: {
                  locales: {
                    [locale: string]: {
                      friendlyName: string;
                      description: string;
                    };
                  };
                };
                type: "link" | "image" | "text" | "title" | "separator";
                value: string;
              }
            ];
          };
      */
    },
  }
}
```

---

## Body properties

- `engineGroup`: Name of the engine group
- `model`: Group model name
- `affinity`: Specifies accepted types and models for group membership (see above)
- `metadataMappings`: Mappings of the metadata in Elasticsearch format
- `defaultValues`: Default values for the metadata
- `metadataDetails`: Translations, metadata group, and editor hint (See [ MetadataDetails ](../../../concepts/metadatadetails/index.md))
- `metadataGroups`: Groups list with translations for group name
- `tooltipModels`: Tooltip model list, containing each labels and tooltip content to display

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "writeGroup",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<modelId>",
    "_source": {
      // Group model content
    },
  }
}
```

## Errors

| error                                                                          | code    | cause                                               |
| ------------------------------------------------------------------------------ | ------- | --------------------------------------------------- |
| [ MappingsConflictsError ](../../../errors/mappings-conflicts/index.md)        | **409** | Writing a group with conflicting metadata mappings |