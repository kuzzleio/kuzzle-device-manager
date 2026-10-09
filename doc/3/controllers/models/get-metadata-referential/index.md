---
code: true
type: page
title: getMetadataReferential
description: Gets the metadata referential
---

# getMetadataReferential

Gets the metadata referential: the metadata that asset, device and group models can reference by name.

See [Metadata Referential](../../../concepts/models/index.md#metadata-referential).

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/metadata
Method: GET
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "getMetadataReferential"
}
```

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "getMetadataReferential",
  "requestId": "<unique request identifier>",
  "result": {
    "operatingStatus": {
      "mappings": { "type": "keyword" },
      "locales": {
        "en": { "friendlyName": "Status", "description": "Operating status" }
      },
      "editorHint": { "type": "optionSelector", "values": ["active", "inactive"] },
      "defaultValue": "active",
      "icon": "power-off",
      "managed": true // Registered from code: cannot be modified or deleted through the API
    }
  }
}
```
