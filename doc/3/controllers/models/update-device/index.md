---
code: true
type: page
title: updateDevice
description: Adds metadata to a device model
---

# updateDevice

Adds metadata, referenced from the [metadata referential](../../../concepts/models/index.md#metadata-referential), to an existing device model.

Device models are additive only from the API:

- the body contains only `metadata`, the full set of references: the existing ones and the new ones
- every existing reference must be kept. The overrides of an existing reference (`locales`, `defaultValue`, `group`, `icon`) can change
- the measures and the inline metadata of the model cannot be changed

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
    "metadata": {
      /*
        Metadata referenced from the metadata referential, existing and new ones.
          [name: string]: true | {
            locales?: { [locale: string]: { friendlyName: string; description: string } };
            defaultValue?: any;
            group?: string;
            icon?: string;
          };
      */
    }
  }
}
```

---

## Arguments

- `model`: Device model name

---

## Body properties

- `metadata`: Full set of metadata references of the model

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

- A [ BadRequestError ](https://docs.kuzzle.io/core/2/api/errors/types/#badrequesterror) (400) is thrown if the body contains another field than `metadata`, if an existing reference is missing, or if a reference is invalid
- A [ MappingsConflictsError ](../../../errors/mappings-conflicts/index.md) (409) is thrown if the new metadata conflict with the existing mappings
- A [ NotFoundError ](https://docs.kuzzle.io/core/2/api/errors/types/#notfounderror) (404) is thrown if the device model does not exist
