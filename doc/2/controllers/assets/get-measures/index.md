---
code: true
type: page
title: getMeasures
description: Retrieves measure from an asset
---

# getMeasures

Retrieves measure from an asset.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/:_id/measures
Method: GET or POST
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "getMeasures",
  "engineId": "<engineId>",
  "_id": "<assetId>",
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
  "startAt": "<beginning of time range>",
  "endAt": "<end of time range>",
  "type": "<measure type>"
}
```

---

## Arguments

- `engineId`: engine id
- `_id`: asset id
  ISO_8601
- `from`: paginates search results by defining the offset from the first result you want to fetch. Usually used with the `size` argument
- `size`: set the maximum number of documents returned per result page
- `startAt`: beginning of time range (ISO 8601)
- `endAt`: end of time range (ISO 8601)
- `type`: measure type

## Body properties

- `query`: the search query itself, using the [Koncorde Filters DSL](/core/2/api/koncorde-filters-syntax) syntax.
- `sort`: contains a list of fields, used to [sort search results](https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-request-sort.html), in order of importance

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "search",
  "requestId": "<unique request identifier>",
  "result": {
    "measures": [
      {
        "_id": "<measureId>",
        "_source": {
          // Measure content
        },
      },
    ],
    "total": 42
  }
}
```
