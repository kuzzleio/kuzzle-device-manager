---
code: true
type: page
title: registerQos
description: Add properties definition to the 'qos' field
---

# registerQos

Add properties definition to the `qos` field of the `devices` collection.


```ts
registerQos (mappings: JSONObject, options: JSONObject);
```

<br/>

| Arguments | Type                  | Description                                 |
|-----------|-----------------------|---------------------------------------------|
| `mappings` | <pre>JSONObject</pre> | Mappings definiton of the `qos` property |
| `options` | <pre>JSONObject</pre> | Additional options |

### options

| Properties | Type                  | Description                                 |
|-----------|-----------------------|---------------------------------------------|
| `group` | <pre>string</pre> | Name of the group for which the mappings should apply. If unspecified, mappings will apply to every group who does not have specific definition. |

## Usage

```ts
import { DeviceManagerPlugin } from 'kuzzle-plugin-device-manager';

const deviceManagerPlugin = new DeviceManagerPlugin();

deviceManagerPlugin.devices.registerQos({
  battery: { type: 'integer' }
}, { group: 'water_management' });
```