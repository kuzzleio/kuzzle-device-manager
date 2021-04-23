---
code: true
type: page
title: registerQos
description: Add properties definition to the 'qos' field
---

# registerQos

Add properties definition to the `qos` field of the `devices` collection.


```ts
registerQos (mapping: JSONObject, options: JSONObject);
```

<br/>

| Arguments | Type                  | Description                                 |
|-----------|-----------------------|---------------------------------------------|
| `mapping` | <pre>JSONObject</pre> | Mapping definiton of the `qos` property |
| `options` | <pre>JSONObject</pre> | Additional options |

### options

| Properties | Type                  | Description                                 |
|-----------|-----------------------|---------------------------------------------|
| `tenantGroup` | <pre>string</pre> | Name of the group for which the mapping should apply. If unspecified, mappings will apply to every group. |

## Usage

```ts
import { DeviceManagerPlugin } from 'kuzzle-plugin-device-manager';

const deviceManagerPlugin = new DeviceManagerPlugin();

deviceManagerPlugin.devices.registerQos({
  battery: { type: 'integer' }
}, { tenantGroup: 'water_management' });
```