---
code: true
type: page
title: search
description: Searches for assets
---

# search

Searches for assets.

See also [document:search](/core/2/api/controllers/document/search) API action.

---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:index/assets/_search[?from=<int>][&size=<int>][&scroll=<time to live>][&lang=<query language>]
Method: POST or GET
Body:
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
  "index": "<index>",
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
  "from": "<starting offset>",
  "size": "<page size>",
  "scroll": "<scroll duration>",
  "lang": "<query language>"
}
```

---

## Arguments

- `index`: index name

### Optional:

- `from`: paginates search results by defining the offset from the first result you want to fetch. Usually used with the `size` argument
- `scroll`: creates a forward-only result cursor. This option must be set with a [time duration](https://www.elastic.co/guide/en/elasticsearch/reference/7.4/common-options.html#time-units), at the end of which the cursor is destroyed. If set, a cursor identifier named `scrollId` is returned in the results. This cursor can then be moved forward using the [scroll](/core/2/api/controllers/document/scroll) API action
- `size`: set the maximum number of documents returned per result page
- `lang`: specify the query language to use. By default, it's `elasticsearch` but `koncorde` can also be used.

---

## Body properties

### Optional:

- `query`: the search query itself, using the [ElasticSearch Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/7.4/query-dsl.html) or the [Koncorde Filters DSL](/core/2/api/koncorde-filters-syntax) syntax.
- `aggregations`: control how the search result should be [aggregated](https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations.html)
- `sort`: contains a list of fields, used to [sort search results](https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-request-sort.html), in order of importance

An empty body matches all documents in the queried collection.

::: info
Only the following fields are available in the top level of the search body: `aggregations`, `aggs`, `collapse`, `explain`, `from`, `highlight`, `query`, `search_timeout`, `size`, `sort`, `_name`, `_source`, `_source_excludes`, `_source_includes`
:::

---

## Response

Returns a paginated search result set, with the following properties:

- `aggregations`: provides aggregation information. Present only if an `aggregations` object has been provided in the search body
- `hits`: array of found documents. Each document has the following properties:
  - `_id`: document unique identifier
  - `_score`: [relevance score](https://www.elastic.co/guide/en/elasticsearch/guide/current/relevance-intro.html)
  - `_source`: new document content
  - `highlight`: optional result from [highlight API](https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-request-body.html#request-body-search-highlighting)
- `remaining`: remaining documents that can be fetched. Present only if the `scroll` argument has been supplied - `scrollId`: identifier to the next page of result. Present only if the `scroll` argument has been supplied
- `total`: total number of found documents. Can be greater than the number of documents in a result page, meaning that other matches than the one retrieved are available

```js
{
  "status": 200,
  "error": null,
  "index": "<index>",
  "action": "search",
  "controller": "device-manager/asset",
  "requestId": "<unique request identifier>",
  "result": {
    "scrollId": "<scroll id>",
    "hits": [
      {
        "_id": "<asset unique identifier>",
        "_score": 1,
        "_source": {
          // asset content
        }
      },
      {
        "_id": "<another asset unique identifier>",
        "_score": 1,
        "_source": {
          // asset content
        }
      }
    ],
    // Present only if aggregation parameters have been set
    "aggregations": {
      "aggs_name": {}
    },
    "total": 42
  }
}
```
