---
code: true
type: page
title: registerMeasure
description: Add properties definition to the 'measures' field
---

# registerMeasure

Add properties definition to the `measures` field of the `devices` collection.


```ts
registerMeasure (measureName: string, mappings: JSONObject, options: JSONObject);
```

<br/>

| Arguments | Type                  | Description                                 |
|-----------|-----------------------|---------------------------------------------|
| `measureName` | <pre>string</pre> | Name of the measure you are willing to add to the `measures` field |
| `mappings` | <pre>JSONObject</pre> | Mappings definiton of the custom measure property |
| `options` | <pre>JSONObject</pre> | Additional options |

### options

| Properties | Type                  | Description                                 |
|-----------|-----------------------|---------------------------------------------|
| `tenantGroup` | <pre>string</pre> | Name of the group for which the mappings should apply. If unspecified, mappings will apply to every group who does not have specific definition |

## Usage

```ts
import { DeviceManagerPlugin } from 'kuzzle-plugin-device-manager';

const deviceManagerPlugin = new DeviceManagerPlugin();

deviceManagerPlugin.devices.registerMeasure(
  'temperature',
  {
    dynamic: 'false',
    properties: {
      fahrenheit: { type: 'float' },
      celsius: { type: 'float' }
    }
  },
  { tenantGroup: 'water_management' });

deviceManagerPlugin.devices.registerMeasure(
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