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

## search

search assets. 
Can take a query to filter.

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/asset/search?index=<tenant>[&from=<int>&size=<int>]
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
  "action": "search",
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

## search

search sensors. 
Can take a query to filter.

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/sensor/search?index=<tenant>[&from=<int>&size=<int>]
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
  "action": "search",
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

## Reception de Payload

```json
// Payload
{
  "devEUI": "12345-azerty",
  "register55": 23.3,
  "batteryLevel": 0.8
}
```

### Enregistrement du décodeur

```ts
// Declared in the plugin
type Measure = {
  type: string;
  value: {
    properties: {
      temperature: { type: 'float' },
      position: {
        properties: {
          latitude: { type: 'float' },
          longitude: { type: 'float' },
          accuracy: { type: 'float' },
        }
      }
    }
  };
  updatedAt: number;
  payloadUuid: string;
} 



class Sensor {
  _id: string;

  _source: {
    model: string;
    manufacturerId: string;

    measures: Measure[];    
    metadata: JSONObject;

    assetId?: string;
    tenantId?: string;
  };

  constructor (model: string, manufacturerId: string, measures: Measure[]) {
    this._id = `${model}/${manufacturerId}`;
  
    this._source = {
      model,
      manufacturerId,
      measures,
      metadata: {},
      assetId: null,
      tenantId: null
    };
  }
}

// Declared by the developer
class IneoDecoder extends Decoder {
  constructor () {
    super('IneoTemp');

    // Default route (optional)
    this.http = [{ verb: 'post', path: 'payloads/ineo' }]
  }

  async validate (payload: JSONObject, request?: KuzzleRequest): Promise<boolean> | never {
    if (! payload.manufacturerId) {
      throw new Error('Missing "manufacturerId"');
    }

    return true; 
  }

  async decode (payload: JSONObject): Promise<SensorContent> {
    const sensorContent: SensorContent = {
      manufacturerId: payload.devEUI,
      model: this.sensorModel,
      measures: {
        temperature: {
          updatedAt: Date.now(),
          payloadUuid: uuidv4(),
          value: payload.register55,
        }
      },
      metadata: {
        battery: payload.batteryLevel
      }
    };

    return sensorContent;
  }
}

plugin.registerDecoder(new IneoDecoder());
```

L'enregistrement du `IneoDecoder` déclenche les actions suivantes:
 - ajout d'une action `ineo-temp` au contrôleur `payloads`

### Reception du premier payload

La première fois qu'un payload est reçu:
  - execution de `valid` pour continuer ou non le process
  - execution de `decode`
  - creation du document du sensor dans la collection `sensors` de l'index maitre
  - execution de `afterRegister` (pipe)
  - renvoi réponse d'API (retour de `afterRegister` ou le contenu du sensor créé)

L'ID du document est la concaténation de `model` et `manufacturerId`.

```js
// Example of a sensor document
ID: "IneoGTO42/98765poiuyt"

{
  "manufacturerId": "98765poiuyt",
  "model": "IneoGTO42",
  "measures": {
    "temperature": {
      "updatedAt": 1610561030361,
      "payloadUuid": "...",
      "value": 23.3,
    }
  },
  "metadata": {
    "battery": 2.3
  },
  "assetId": "HYjsk562Kzk",
  "tenantId": "tenant-worksite-kuzzle", 
}
```

### Reception d'un nouveau payload

Lorsqu'une mise à jour est reçu:
  - execution de `validate` pour continuer ou non le process
  - execution de `decode`
  - execution de `beforeUpdate` (pipe d'enrichissement)
  - mise à jour du document du sensor dans la collection `sensors` de l'index maitre
  - Si assigné à un tenant:
    - propagation dans la collection `sensors` du tenant
    - Si lié à un asset:
      - copie du résultat de `copyToAsset` dans le document de l'asset lié
  - execution de `afterUpdate` (pipe)
  - historisation
  - renvoi réponse d'API (retour de `afterUpdate` ou le contenu du sensor mis à jour)


## Assignation à un tenant

Route d'API pour assigner un sensor à un tenant.

Lors de l'assignation d'un sensor à un tenant:
  - set le `tenantId` dans la collection `sensors` de l'index maitre
  - création du document dans la collection `sensors` du tenant

## Liaison avec un asset

Route d'API pour lier un sensor à un asset.

Lors de la liaison d'un sensor à un asset:
  - set le `assetId` dans la collection `sensors` de l'index maitre
  - set le `assetId` dans la collection `sensors` du tenant
  - ajout des mesures du sensor dans la propriété `measures` de l'asset

```js
// Example of an Asset
{
  "reference": "XYZ-42-AZE",
  "model": "PERFO-GTX1",
  
  "metadata": {},

  "measures": {
    "temperature": {
      "id": "IneoGTO42-98765poiuyt",
      "model": "IneoGTO42",
      "manufacturerId": "98765poiuyt",

      "updatedAt": 1610561030361,
      "payloadUuid": "...",
      "value": 23.3,

      "metadata": {
        "battery": 2.3
      }
    }
  },
}
```
