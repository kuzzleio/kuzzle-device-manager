---
code: true
type: page
title: registerMetadata
description: Add properties definition to the 'metadata' field
---

# registerMetadata

Add properties definition to the `metadata` field of the `assets` collection.


```ts
registerMetadata (mappings: JSONObject, options: JSONObject);
```

<br/>

| Arguments | Type                  | Description                                 |
|-----------|-----------------------|---------------------------------------------|
| `mappings` | <pre>JSONObject</pre> | Mappings definiton of the `metadata` property |
| `options` | <pre>JSONObject</pre> | Additional options |

### options

| Properties | Type                  | Description                                 |
|-----------|-----------------------|---------------------------------------------|
| `group` | <pre>string</pre> | Name of the group for which the mappings should apply. If unspecified, mappings will apply to every group who does not have specific definition. |

## Usage

```ts
import { DeviceManagerPlugin } from 'kuzzle-plugin-device-manager';

const deviceManagerPlugin = new DeviceManagerPlugin();

deviceManagerPlugin.assets.registerMetadata({
    serial: {
    type: 'keyword',
    fields: {
      text: { type: 'text' } }
  }
}, { group: 'water_management' });
```