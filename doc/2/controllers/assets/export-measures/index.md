---
code: true
type: page
title: exportMeasures
description: Export measure history from an asset
---

# exportMeasures

This action allow to export the measures history of an asset.

The measures are exported as a CSV stream.

The export process have two steps:

1. execute the `exportMeasures` action with WebSocket or HTTP POST to prepare an export and retrieve an export link
2. GET request to the generated export link through a tag `<a href="{export-link}">Download</a>`

Those two steps are necessary to avoid the browser to crash when exporting a lot of data.

Export link are valid for 2 minutes.

---

## Query Syntax

### HTTP

```http
POST: http://kuzzle:7512/_/device-manager/:engineId/assets/:_id/measures/_export
GET: device-manager/:engineId/assets/:_id/measures/_export/:exportId
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "exportMeasures",
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
    "link": " http://localhost:7512/_/device-manager/<engine id>/devices/<asset id>/measures/_export/<export id>?jwt=<token>"
  }
}
```
