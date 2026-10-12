---
code: true
type: page
title: updateDevice
description: Adds metadata to a device model
---

# updateDevice

Adds metadata of the [metadata referential](../../../concepts/models/index.md#metadata-referential) to an existing device model.

Device models are additive only from the API:

- the body contains only `metadataMappings`, `metadataDetails` and `defaultValues`
- `metadataMappings` is the full set of metadata: every existing metadata must be kept unchanged, new metadata must come from the referential (`{ "referential": true }`)
- `metadataDetails` and `defaultValues` replace the existing ones when present, and are kept when omitted. The details and default value of a new metadata are filled from the referential when missing
- the measures of the model cannot be changed

The engines mappings are updated and the existing devices get the new metadata with their default value.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/devices/:model
Method: PATCH
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "updateDevice",
  "model": "<device model>",

  "body": {
    "metadataMappings": {
      // Existing metadata, unchanged, and new ones: { "<name>": { "referential": true } }
    },

    // Optional

    "metadataDetails": {
      // Metadata details, see writeDevice
    },
    "defaultValues": {
      // Metadata default values
    }
  }
}
```

---

## Arguments

- `model`: Device model name

---

## Body properties

- `metadataMappings`: Full set of metadata mappings of the model
- `metadataDetails`: (optional) Metadata details, kept when omitted
- `defaultValues`: (optional) Metadata default values, kept when omitted

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "updateDevice",
  "requestId": "<unique request identifier>",
  "result": {
    "_id": "<modelId>",
    "_source": {
      // Updated device model content
    },
  }
}
```

## Errors

- A [ BadRequestError ](https://docs.kuzzle.io/core/2/api/errors/types/#badrequesterror) (400) is thrown if the body contains another field, if an existing metadata is missing or modified, if a new metadata does not come from the referential, or if a referential metadata is unknown
- A [ MappingsConflictsError ](../../../errors/mappings-conflicts/index.md) (409) is thrown if the new metadata conflict with the existing models or the engines collections mappings
- A [ NotFoundError ](https://docs.kuzzle.io/core/2/api/errors/types/#notfounderror) (404) is thrown if the device model does not exist
