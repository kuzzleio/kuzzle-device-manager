---
code: false
type: page
title: Create a measure definition
description: Defining new measure type
order: 400
---

# Defining new measure type

KDM already has some measure types already defined like a gps position, humidity, a battery level, a movement or a temperature. We can also define our own measure types.

If we want to know how mush our fridge has been shaken, we will need a 3d accelerometer device. First, create a file and add the definition of the measurement, the mappings and the unti:

```ts
import { Measurement, MeasureDefinition } from '../types';

export type Accelerometer3dMeasurement = Measurement<{
  x: number;
  y: number;
  z: number;
}>;

export const accelerometer3dMeasure: MeasureDefinition = {
  valuesMappings: {
    x: { type: 'float' },
    y: { type: 'float' },
    z: { type: 'float' },
  },
  unit: {
    name: 'Acceleration',
    sign: 'm/s^2',
    type: 'number',
  },
};
```

Next, register it in your app with the name `acceleration3d`:

```ts
  constructor () {
    super('my-application');
    const deviceManager = new DeviceManagerPlugin();
    this.plugin.use(deviceManager);

    deviceManager.decoders.register(new DummyMultiTempDecoder());
    deviceManager.measures.register('acceleration3d', acceleration3dMeasure);
  }
```

To show how it works, create another decoder :

```ts
import { JSONObject } from 'kuzzle';

import {
    DecodedPayload, Decoder
} from '../../../../index';
import { Acceleration3dMeasurement } from '../measures/Acceleration3dMeasure';

export class DummyAccelerometer3dDecoder extends Decoder {
  public measures = [
    { name: '3d acceleration', type: 'acceleration3d' },
  ] as const;

  constructor () {
    super();

    this.payloadsMappings = {
      deviceEUI: { type: 'keyword' }
    };
  }

  async validate (payload: JSONObject) {
    return payload.x && payload.y && payload.z && payload.id;
  }

  async decode (payload: JSONObject): Promise<DecodedPayload<Decoder>> {
    const decodedPayload = new DecodedPayload<DummyAccelerometer3dDecoder>(this);

    const measurement: Acceleration3dMeasurement = {
      measuredAt: Date.now(),
      type: 'acceleration3d',
      values: {
        x: payload.x,
        y: payload.y,
        z: payload.z,
      }
    }

    decodedPayload.addMeasurement(payload.id, '3d acceleration', measurement);

    return decodedPayload;
  }
}
```

You can now create a device and feed it some measures:

```sh
curl localhost:7512/_/device-manager/payload/dummy-accelerometer3d \
--json '{
  "id": "ref1",
  "x": 1,
  "y": 3,
  "z": 2
}'
```

To have it linked to your asset, attach it to our `my-engine` and link it to your asset:

```sh
curl localhost:7512/_/device-manager/my-engine/devices/DummyAccelerometer3d-ref1/_attach -X PUT

curl localhost:7512/_/device-manager/my-engine/devices/DummyAccelerometer3d-ref1/_link/fridge-Fridger3000-ref1 -X PUT
```

:::hint
A link without any `measureNamesLinks` will bind each `deviceMeasureName` declared by the decoder to an equal `assetMeasureName`
:::

Your new measures will be in your asset:

```sh
curl localhost:7512/_/device-manager/payload/dummy-accelerometer3d \
--json '{
  "id": "ref1",
  "x": 4,
  "y": 5,
  "z": 6
}'
```

