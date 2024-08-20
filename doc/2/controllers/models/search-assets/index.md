---
code: true
type: page
title: searchAssets
description: Searches for asset models
---

# searchAssets

Searches for asset models.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/models/assets/_search
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/models",
  "action": "searchAssets",
  "engineGroup": "<engineGroup>",
  "body": {
    "query": {
      // ...
    },
    "sort": [
      // ...
    ]
  },

  // optional:
  "from": "<starting offset>",
  "size": "<page size>",
}
```

---

## Arguments

- `engineGroup`: name of the engine group
- `from`: paginates search results by defining the offset from the first result you want to fetch. Usually used with the `size` argument
- `size`: set the maximum number of documents returned per result page

## Body properties

- `query`: the search query itself, using the [ElasticSearch Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/7.4/query-dsl.html).
- `sort`: contains a list of fields, used to [sort search results](https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-request-sort.html), in order of importance.

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/models",
  "action": "searchAssets",
  "requestId": "<unique request identifier>",
  "result": {
    "hits": [
      {
        "_id": "<assetModelId>",
        "_source": {
          // Asset model content
        },
      },
    ],
    "total": 42
  }
}
```
