# Device manager

The device manager module is intended to manage devices and assets.
It contains 2 controllers:

## AssetController

Designed to manage an `asset`, representing either a room, a person, a physical object etc..

The API of this controller is the following:

## Create

Creates a new asset.

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/asset/create?index=<tenant>[&refresh=wait_for&_id=<assetId>]
Method: POST
Body:
```

```js
{
  // document content
}
```

### Other protocols

```js
{
  "index": "tenant",
  "controller": "device-manager/asset",
  "action": "create",
  "_id": "<assetId>",
  "body": {
    // document content
  }
}
```

---

## Arguments

- `index`: tenant name

### Optional:

- `_id`: set the assetId unique ID to the provided value, instead of auto-generating a random ID
- `refresh`: if set to `wait_for`, Kuzzle will not respond until the newly created document is indexed

---

## Body properties

Document content to create.

---

## Delete

Deletes an asset. 
If the asset is linked to a sensor it will return an error.

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/asset/delete&index=<tenant>[&refresh=wait_for&_id=<assetId>]
Method: DELETE
```

### Other protocols

```js
{
  "index": "tenant",
  "controller": "device-manager/asset",
  "action": "delete",
  "_id": "<assetId>"
}
```

---

## Arguments

- `index`: tenant name
- `_id`: Asset id to delete

---

## List

List assets. 
Can take a query to filter.

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/asset/list?index=<tenant>[&from=<int>&size=<int>]
Method: POST
BODY:
```

```js
{
  "query": {
    // ...
  },
  "aggregations": {
    // ...
  },
  "sort": [
    // ...
  ]
}
```

### Other protocols

```js
{
  "index": "tenant",
  "controller": "device-manager/asset",
  "action": "list",
  "body": {
    "query": {
      // ...
    },
    "aggregations": {
      // ...
    },
    "sort": [
      // ...
    ]
  },

  // optional:
  "from": <starting offset>,
  "size": <page size>
}
```

---

## Arguments

- `index`: tenant name

### Optional:

- `from`: paginates search results by defining the offset from the first result you want to fetch. Usually used with the `size` argument
- `size`: set the maximum number of documents returned per result page

---

## Link

Link an asset to a sensor. 
It will also link the sensor to this asset.
If the sensor fails to be linked then it will unlink the asset.

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/asset/link?index=<tenant>&_id=<assetId>[&refresh=wait_for]
Method: POST
Body:
```

```js
{
  "sensorId": "<sensorId>"
}
```

### Other protocols

```js
{
  "index": "tenant",
  "controller": "device-manager/asset",
  "action": "link",
  "_id": "<assetId>",
  "body": {
    "sensorId": "<sensorId>"
  }
}
```

---

## Unlink

Unlink an asset.
Will also unlink the sensor the asset is linked to.
If it fails to unlink the sensor then it will link the asset again.

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/asset/unlink?index=<tenant>&_id=<assetId>[&refresh=wait_for]
Method: POST
```

### Other protocols

```js
{
  "index": "tenant",
  "controller": "device-manager/asset",
  "action": "unlink",
  "_id": "<assetId>"
}
```

---

## SensorController

Designed to manage a `sensor`.

The API of this controller is the following:

## Create

Creates a new sensor.

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/sensor/create?index=<tenant>[&refresh=wait_for&_id=<sensorId>]
Method: POST
Body:
```

```js
{
  // document content
}
```

### Other protocols

```js
{
  "index": "tenant",
  "controller": "device-manager/sensor",
  "action": "create",
  "_id": "<sensorId>",
  "body": {
    // document content
  }
}
```

---

## Arguments

- `index`: tenant name

### Optional:

- `_id`: set the sensor unique ID to the provided value, instead of auto-generating a random ID
- `refresh`: if set to `wait_for`, Kuzzle will not respond until the newly created document is indexed

---

## Body properties

Document content to create.

---

## Delete

Deletes a sensor. 
If the sensor is linked to an asset it will return an error.

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/sensor/delete&index=<tenant>[&refresh=wait_for&_id=<sensorId>]
Method: DELETE
```

### Other protocols

```js
{
  "index": "tenant",
  "controller": "device-manager/sensor",
  "action": "delete",
  "_id": "<sensorId>"
}
```

---

## Arguments

- `index`: tenant name
- `_id`: Sensor id to delete

---

## List

List sensors. 
Can take a query to filter.

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/sensor/list?index=<tenant>[&from=<int>&size=<int>]
Method: POST
BODY:
```

```js
{
  "query": {
    // ...
  },
  "aggregations": {
    // ...
  },
  "sort": [
    // ...
  ]
}
```

### Other protocols

```js
{
  "index": "tenant",
  "controller": "device-manager/sensor",
  "action": "list",
  "body": {
    "query": {
      // ...
    },
    "aggregations": {
      // ...
    },
    "sort": [
      // ...
    ]
  },

  // optional:
  "from": <starting offset>,
  "size": <page size>
}
```

---

## Arguments

- `index`: tenant name

### Optional:

- `from`: paginates search results by defining the offset from the first result you want to fetch. Usually used with the `size` argument
- `size`: set the maximum number of documents returned per result page

---

## Link

Link a sensor to an asset.
It will also link the asset to this sensor.
If the asset fails to be linked then it will unlink the sensor.

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/asset/link?index=<tenant>&_id=<sensorId>[&refresh=wait_for]
Method: POST
Body:
```

```js
{
  "assetId": "<assetId>"
}
```

### Other protocols

```js
{
  "index": "tenant",
  "controller": "device-manager/asset",
  "action": "link",
  "_id": "<sensorId>",
  "body": {
    "assetId": "<assetId>"
  }
}
```

---

## Unlink

Unlink a sensor.
Will also unlink the asset the sensor is linked to.
If it fails to unlink the asset then it will link the sensor again.

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/asset/unlink?index=<tenant>&_id=<sensorId>[&refresh=wait_for]
Method: POST
```

### Other protocols

```js
{
  "index": "tenant",
  "controller": "device-manager/asset",
  "action": "unlink",
  "_id": "<sensorId>"
}
```

---

## Push

Push a measurement.
A sensor can push a measurement even if it is not linked to an asset.

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/asset/push?index=<tenant>&_id=<sensorId>[&refresh=wait_for]
Method: POST
Body:
```

```js
{
  "type": "<measurement type>"
  "value": "<measurement value>"
}
```

### Other protocols

```js
{
  "index": "tenant",
  "controller": "device-manager/asset",
  "action": "push",
  "_id": "<sensorId>",
  "body": {
    "type": "<measurement type>"
    "value": "<measurement value>"
  }
}
```

---