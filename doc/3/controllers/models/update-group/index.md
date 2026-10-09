---
code: true
type: page
title: updateGroup
description: Update a group model
---

# updateGroup

Update an existing group model.

The group model is the one available for the given engine groups: a model of these groups first, then a `commons` model.
Its scope (`engineGroups`) is kept.

`affinity`, `icon` and `metadata` are kept when omitted. The other body properties replace the existing ones, and default to empty when omitted.

The metadata of the existing groups of every engine of the model scope are refreshed: added metadata are set to their default value, removed metadata are deleted.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/groups/:model?engineGroups=<engine group>
Method: PATCH
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "updateGroup",
  "engineGroups": ["<engine group>"],
  "model": "<group model>",

  "body": {

    // Optional

    "affinity": {
      "type": ["assets", "devices"], // Array of accepted types
      "models": {
        "assets": ["AssetModelA", "AssetModelB"], // Accepted asset models
        "devices": ["DeviceModelA"] // Accepted device models
      },
      "strict": false // If true, restricts group membership to specified types/models
    },
    "icon": "<icon>", // Free-form string, e.g. a FontAwesome icon name, a URL to a PNG/SVG image, or inline SVG markup
    "metadataMappings": {
      // Metadata mappings
    },
    "defaultValues": {
      // Default values for metadata
    },
    "metadataDetails": {
      /*
        Metadata details including translations and group.
          [name: string]: {
            group?: string;
            locales: {
              [locale: string]: {
                friendlyName: string;
                description: string;
              };
            };
            editorHint?: BaseEditorHint | OptionsSelectorDefinition | DatetimeEditorHint;
            icon?: string;
          };
      */
    },
    "metadata": {
      /*
        Metadata referenced from the metadata referential. Without it, the existing references are kept.
          [name: string]: true | {
            locales?: { [locale: string]: { friendlyName: string; description: string } };
            defaultValue?: any;
            group?: string;
            icon?: string;
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
    "locales": {
      /*
        [locale]: {
          friendlyName: string,
          description: string
        }
      */
    }
  }
}
```

---

## Arguments

- `engineGroups`: Engine groups the group model is available for. Defaults to `["commons"]`
- `model`: Group model name

---

## Body properties

- `affinity`: Asset and device types and models accepted in the groups. Kept when omitted
- `icon`: Icon representing the group model. Kept when omitted
- `metadataMappings`: Mappings of the metadata in Elasticsearch format
- `defaultValues`: Default values for the metadata
- `metadataDetails`: Translations, metadata group and editor hint
- `metadataGroups`: Groups list with translations for group name
- `metadata`: Metadata referenced from the [metadata referential](../../../concepts/models/index.md#metadata-referential). Kept when omitted, send it to remove references
- `locales`: Translations specific to the model

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "updateGroup",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<modelId>",
    "_source": {
      // Updated group model content
    },
  }
}
```

## Errors

Updating a group model with metadata mappings can cause conflicts, in this case a [ MappingsConflictsError ](../../../errors/mappings-conflicts/index.md) will be thrown with the HTTP code **409**.

A [ NotFoundError ](https://docs.kuzzle.io/core/2/api/errors/types/#notfounderror) is thrown if no group model with this name is available for the engine groups.
