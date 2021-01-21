---
code: false
type: page
title: Multi Tenancy
description: Multi Tenancy workflow
order: 400
---

# Multi Tenancy

The plugin is designed to work with several tenants, each with their own sensors and assets.

Each tenant has its own index with the required collections.

It is possible to manage its holders with the [device-manager/engine](/kuzzle-iot-platform/device-manager/1/controllers/engine) controller.

::: info
When used with the multi-tenant plugin, the collections needed by the device-manager are automatically created when creating a new tenant with the multi-tenant plugin.
:::

### Sensors

The list of available sensors is stored in the sensors collection of the administration index (device-manager).

When assigning the sensor to a tenant, the `tenantId` property is updated and the sensor is copied to the `sensors` collection of the tenant's index.

### Collections

When a new engine is created on a tenant index, it will create the following collections:

**sensors**

```js
{
  "model": {
    "type": "keyword"
  },
  "reference": {
    "type": "keyword"
  },
  "metadata": {
    "type": "object",
    "dynamic": "false"
  },
  "qos": {
    "type": "object",
    "dynamic": "false"
  },
  "measures": {
    "properties": {
      "position": {
        "properties": {
          "accuracy": {
            "type": "integer"
          },
          "altitude": {
            "type": "float"
          },
          "latitude": {
            "type": "float"
          },
          "longitude": {
            "type": "float"
          },
          "payloadUuid": {
            "type": "keyword"
          },
          "updatedAt": {
            "type": "date"
          }
        }
      },
      "temperature": {
        "properties": {
          "payloadUuid": {
            "type": "keyword"
          },
          "updatedAt": {
            "type": "date"
          },
          "value": {
            "type": "float"
          }
        }
      }
    }
  },
  "tenantId": {
    "type": "keyword"
  },
  "assetId": {
    "type": "keyword"
  },
}
```

**assets**

```js
{  
  "model": {
    "type": "keyword"
  },
  "reference": {
    "type": "keyword"
  },
  "metadata": {
    "type": "object",
    "dynamic": "false"
  },
  "measures": {
    "properties": {
      "position": {
        "dynamic": "false",
        "properties": {
          "accuracy": {
            "type": "integer"
          },
          "altitude": {
            "type": "float"
          },
          "id": {
            "type": "keyword"
          },
          "latitude": {
            "type": "float"
          },
          "longitude": {
            "type": "float"
          },
          "qos": {
            "type": "object"
          },
          "model": {
            "type": "keyword"
          },
          "payloadUuid": {
            "type": "keyword"
          },
          "reference": {
            "type": "keyword"
          },
          "updatedAt": {
            "type": "date"
          }
        }
      },
      "temperature": {
        "dynamic": "false",
        "properties": {
          "id": {
            "type": "keyword"
          },
          "qos": {
            "type": "object"
          },
          "model": {
            "type": "keyword"
          },
          "payloadUuid": {
            "type": "keyword"
          },
          "reference": {
            "type": "keyword"
          },
          "updatedAt": {
            "type": "date"
          },
          "value": {
            "type": "float"
          }
        }
      }
    }
  },
}
```
