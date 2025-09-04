---
code: true
type: page
title: export
description: Export assets as CSV
---

# export

Exports assets as a CSV stream.

This endpoint allows you to export the list of assets, including their model, reference, last measured values, and metadata, in CSV format. The export process is performed in two steps:

1. Execute the `export` action (HTTP POST or WebSocket) to prepare the export and retrieve an export link.
2. Perform a GET request to the generated export link to download the CSV file.

Export links are valid for a limited time (typically 2 minutes).

::: info
The generated export link does not include protocol, host, or port. You must add these to the URL before downloading.
:::

---

## Query Syntax

### HTTP

**Prepare export (step 1):**

```http
POST: http://kuzzle:7512/_/device-manager/:engineId/assets/_export
Body: {
  "query": { /* Koncorde query */ },
  "sort": [ /* sort fields */ ],
  "lang": "koncorde"
}
```

**Download export (step 2):**

```http
GET: http://kuzzle:7512/_/device-manager/:engineId/assets/_export/:exportId
```

### Other protocols

**Prepare export:**

```js
{
  "controller": "device-manager/assets",
  "action": "export",
  "engineId": "<engineId>",
  "body": {
    "query": { /* Koncorde query */ },
    "sort": [ /* sort fields */ ],
    "lang": "koncorde"
  }
}
```

**Download export:**

```js
{
  "controller": "device-manager/assets",
  "action": "export",
  "engineId": "<engineId>",
  "exportId": "<exportId>"
}
```

---

## Arguments

- `engineId`: Engine ID (required)
- `exportId`: Export identifier (required for GET)
- `query`: (optional) Search query for filtering assets (Koncorde syntax)
- `sort`: (optional) Sort fields
- `lang`: (optional) Query language (default: "koncorde")

---

## Response

**Prepare export (POST):**

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/assets",
  "action": "export",
  "requestId": "<unique request identifier>",
  "result": {
    "link": "/_/device-manager/<engineId>/assets/_export/<exportId>"
  }
}
```

**Download export (GET):**

- Returns a CSV file as a stream.
- HTTP headers:
  - `Content-Disposition: attachment; filename="assets.csv"`
  - `Content-Type: text/csv`

---

## Example

```js
// Prepare export
const { result } = await sdk.query({
  controller: "device-manager/assets",
  action: "export",
  engineId: "engine-ayse",
  body: {
    query: { /* ... */ },
    sort: [ /* ... */ ]
  }
});

// Download CSV
const response = await axios.get("http://localhost:7512" + result.link, {
  responseType: "stream"
});
```

---

## Errors

- Returns a readable error message if the export fails or the exportId is invalid.