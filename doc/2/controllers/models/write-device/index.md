---
code: true
type: page
title: writeDevice
description: Write a device model
---

# writeDevice

Write a device model.

This action acts like a create or replace

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/devices
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "writeDevice",
  "body": {
    "model": "<device model>",

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
    "measures": [
      // Array of measure definition with type and name
    ]
  }
}
```

---

## Body properties

- `model`: Device model name
- `metadataMappings`: Mappings of the metadata in Elasticsearch format
- `defaultValues`: Default values for the metadata- 
- `metadataDetails`: Metadata group, translations and editor hint (cf. [ MetadataDetails ](../../../concepts/metadatadetails/index.md))
- `metadataGroups`: Groups list with translations for group name
- `measures`: Array of measure definition. Each item define a `type` and `name` properties for the measure.

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "writeDevice",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<modelId>",
    "_source": {
      // Device model content
    },
  }
}
```

## Errors

Writing a device with metadata mappings can cause conflicts, in this case a [ MappingsConflictsError ](../../../errors/mappings-conflicts/index.md) will be thrown with the HTTP code **409**.