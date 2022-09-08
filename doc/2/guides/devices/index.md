---
code: false
type: page
title: Create devices
description: Create a device and receive a payload
order: 200
---

# Create devices

A device document represent your physical device. We will create one to experiment it. Firstly, we need to operate in an engine. Create one with:

```sh
curl -X POST localhost:7512/_/device-manager/engine/my-engine
```

If you go to the [Kuzzle Admin console](https://next-console.kuzzle.io), you will see your index created. Now you can create your device like this:

```sh
curl localhost:7512/_/device-manager/my-engine/devices \
--json '{"model": "DummyMultiTemp", "reference": "ref1"}'
```

:::hint
You also can add metadatas to your device by adding to the request the json field:
```json
"metadata": {
  // ... whatever you like
}
```
:::

The device document will appear in the collection `device-manager`:`devices` and `my-engine`:`devices` with the id `DummyMultiTemp-ref1`. Since we have the decoder registered for our model, we can now receive a payload:

```sh
curl localhost:7512/_/device-manager/payload/dummy-multi-temp \
--json '{
  "payloads": [
    {
      "deviceEUI": "ref1",
      "registerInner": 31,
      "registerOuter": 32,
      "lvlBattery": 0.9
    }
  ]
}'
```

You can see that the device document now contains those measures. They are also historized in the collection `my-engine`:`measures`. The payload is hiztorize in `device-manager`:`payloads`.

We will now send a payload with multiple measures in it :

```sh
curl localhost:7512/_/device-manager/payload/dummy-multi-temp \
--json '{
  "payloads": [
    {
      "deviceEUI": "ref1",
      "registerInner": 33,
      "registerOuter": 34,
      "lvlBattery": 0.89
    },
    {
      "deviceEUI": "ref2",
      "registerInner": 35,
      "registerOuter": 36,
      "lvlBattery": 0.88
    }
  ]
}'
```

First of all, you can look into our device `DummyMultiTemp-ref1`, the measures now contains the new ones. It's because the device document always holds the most recent measures with a unique `deviceMeasureName`.

You also see that we didn't create `ref2` but the query did not result in an error. That's because the default configuration of Device Manager has the `provisionStrategy` setted to `auto`. It will create the device `DummyMultiTemp-ref2` in the collection `device-manager`:`devices`. Note that:

- The device created is not attached to an engine
- Devices not attached to an engine does not historize the final measures (but keep historizeing the payloads)

:::hint
You can deactivate this option by adding to you application:
TODO : how to deactivate the option ?

```ts
```
:::

We can then attach our new device with this query:

```sh
curl localhost:7512/_/device-manager/my-engine/devices/DummyMultiTemp-ref2/_attach -X PUT
```

Next measures will be hiztorized in `my-engine`:`measures`.
