---
code: true
type: page
title: unlink metadata
description: unlink a metadata with an asset-category
---

# create
unlink a metadata with an asset-category
<!--- TODO : lister les erreurs qui peuvent arriver -->
---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assetCategory/:_id/_unlink/metadata/:metadataId
Method: DELETE
```

### Other protocols

```js
{
  "engineId": "<index>",
  "controller": "device-manager/assetCategory",
  "action": "unlinkMetadata"
}
```

## Arguments

- `engineId`: engine id
- `_id` : Asset Category that need to be unlinked
- `metadataId` : metadata Id that will be unlinked with asset category.

---

## Response

Returns an object with the following properties:

- `_id`: created document unique identifier
- `_source`: assetCategory document content
- `_version`: version of the updated document

Return has same caracteristics as update API action. More information at [document:update](/core/2/api/controllers/document/update).

