---
code: true
type: page
title: search
description: Searches for asset
---

# search

Searches for assets.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assets/_search
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "search",
  "engineId": "<engineId>",
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
  "lang": "<query language>"
}
```

---

## Arguments

- `engineId`: engine id
- `from`: paginates search results by defining the offset from the first result you want to fetch. Usually used with the `size` argument
- `size`: set the maximum number of documents returned per result page
- `lang`: specify the query language to use. By default, it's `elasticsearch` but `koncorde` can also be used.

## Body properties

- `query`: the search query itself, using the [ElasticSearch Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/7.4/query-dsl.html) or the [Koncorde Filters DSL](/core/2/api/koncorde-filters-syntax) syntax.
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
    "hits": [
      {
        "_id": "<assetId>",
        "_source": {
          // Asset content
        },
      },
    ],
    "total": 42
  }
}
```
