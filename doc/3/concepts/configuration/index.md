---
code: false
type: page
title: Configuration
description: Plugin configuration
---

# Configuration

You can customize the behavior of the Device Manager plugin by providing a configuration object in the `plugins` section using the Kuzzle configuration file ([`kuzzlerc`](https://docs.kuzzle.io/core/3/guides/advanced/configuration/)).

```js
{
  "plugins": {
    "device-manager": {
      // Configuration options
    }
  }
}
```

## Options

### Global

The following global options are available:

| Name                  | Type    | Default          | Description                                                                                        |
| --------------------- | ------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `ignoreStartupErrors` | boolean | `false`          | If `true`, the plugin will not throw an error if the engine is not reachable at startup.           |
| `engine.autoUpdate`   | boolean | `true`           | If `true`, the plugin will automatically update the engine collections when the plugin is started. |
| `platformIndex`       | string  | `device-manager` | The index name where the plugin stores its configuration and devices.                              |

### Collections

In order to customize the collections used by the plugin, you can provide a configuration object for each collection. All of these support the following properties:

- `name`: The name of the collection.
- `mappings`: The mappings of the collection (according to the [Elasticsearch mapping specification](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html)).
- `settings`: The settings of the collection (according to the [Elasticsearch settings specification](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules.html)). This property is optional but can be useful to define the number of shards and replicas of the Elasticsearch index or use custom analyzers.

#### Platform index collections

The following collections are used by the plugin. They're automatically created when the plugin is started and shared accross all the tenants' engine.

- `devices`: The collection that stores the devices.
- `config`: The collection that stores the plugin configuration.
- `payloads`: The collection that stores the raw payloads before they are processed and decoded by the plugin.

#### Tenant collections

The following collections are used by the plugin. They're automatically created when the plugin is started and are specific to each tenant engine:

- `config`: The collection that stores the engine configuration.
- `device`: The collection that stores the devices.
- `measures`: The collection that stores the measures once extracted by the decoders.
- `asset`: The collection that stores the assets.
- `groups`: The collection that stores the groups.
- `assetHistory`: The collection that stores the assets history.

## Example

```json
{
  "plugins": {
    "device-manager": {
      "ignoreStartupErrors": false,
      "engine": {
        "autoUpdate": true
      },
      "platformIndex": "device-manager",
      "platformCollections": {
        "devices": {
          "name": "devices",
          "mappings": {
            "properties": {
              "name": { "type": "keyword" },
              "description": { "type": "text" },
              "type": { "type": "keyword" },
              "status": { "type": "keyword" },
              "lastSeen": { "type": "date" }
            }
          },
          "settings": {
            "index": {
              "number_of_shards": 1,
              "number_of_replicas": 1
            }
          }
        },
        "config": {
          "name": "config",
          "mappings": {
            "properties": {
              "name": { "type": "keyword" },
              "value": { "type": "text" }
            }
          },
          "settings": {
            "index": {
              "number_of_shards": 1,
              "number_of_replicas": 1
            }
          }
        },
        "payloads": {
          "name": "payloads",
          "mappings": {
            "properties": {
              "payload": { "type": "text" }
            }
          }
        }
      },
      "engineCollections": {
        "config": {
          "name": "config",
          "mappings": {
            "properties": {
              "name": { "type": "keyword" },
              "value": { "type": "text" }
            }
          }
        },
        "devices": {
          "name": "devices",
          "mappings": {
            "properties": {
              "name": { "type": "keyword" },
              "description": { "type": "text" },
              "type": { "type": "keyword" },
              "status": { "type": "keyword" },
              "lastSeen": { "type": "date" }
            }
          }
        },
        "measures": {
          "name": "measures",
          "mappings": {
            "properties": {
              "deviceId": { "type": "keyword" },
              "timestamp": { "type": "date" },
              "measures": { "type": "object" }
            }
          }
        },
        "asset": {
          "name": "assets",
          "mappings": {
            "properties": {
              "name": { "type": "keyword" },
              "description": {
                "type": "text",
                "analyzer": "description"
              },
              "type": { "type": "keyword" },
              "status": { "type": "keyword" }
            }
          },
          "settings": {
            // Custom analyzer definition
            "analysis": {
              "analyzer": {
                "description": {
                  "type": "custom",
                  "tokenizer": "whitespace"
                }
              }
            }
          }
        },
        "groups": {
          "name": "groups",
          "mappings": {
            "properties": {
              "name": { "type": "keyword" },
              "description": { "type": "text" },
              "type": { "type": "keyword" },
              "status": { "type": "keyword" }
            }
          }
        },
        "assetHistory": {
          "name": "assetHistory",
          "mappings": {
            "properties": {
              "assetId": { "type": "keyword" },
              "timestamp": { "type": "date" },
              "status": { "type": "keyword" }
            }
          }
        }
      }
    }
  }
}
```
