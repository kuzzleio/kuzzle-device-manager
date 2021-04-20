---
code: true
type: page
title: registerMeasures
description: Add properties definition to the 'measures' field
---

# registerMetadata

Add properties definition to the `measures` field of the `devices` collection.


```ts
registerMeasures (measureName: string, mapping: JSONObject, options: JSONObject);
```

<br/>

| Arguments | Type                  | Description                                 |
|-----------|-----------------------|---------------------------------------------|
| `measureName` | <pre>string</pre> | Name of the measure you are willing to add to the `measures` field |
| `mapping` | <pre>JSONObject</pre> | Mapping definiton of the custom measure property |
| `options` | <pre>JSONObject</pre> | Additional options |

### options

| Properties | Type                  | Description                                 |
|-----------|-----------------------|---------------------------------------------|
| `tenantGroup` | <pre>string</pre> | Name of the group for which the mapping should apply. If unspecified, mappings will apply to every group. |

## Usage

```ts
import { DeviceManagerPlugin } from 'kuzzle-plugin-device-manager';

const deviceManagerPlugin = new DeviceManagerPlugin();

deviceManagerPlugin.devices.registerMeasures(
  'temperature',
  {
    dynamic: 'false',
    properties: {
      fahrenheit: { type: 'float' },
      celsius: { type: 'float' }
    }
  },
  { tenantGroup: 'water_management' });

deviceManagerPlugin.devices.registerMeasures(
  'humidity',
  {
    dynamic: 'false',
    properties: {
      percentage: {
        type: 'keyword',
        fields: {
          text: { type: 'text' } }
      }
    }
  },
  { tenantGroup: 'air_quality' });
```