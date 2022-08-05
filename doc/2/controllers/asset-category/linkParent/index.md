---
code: true
type: page
title: link metadata
description: link an asset-category with a parent category
---

# create

link an asset-category with a parent category
<!--- TODO : lister les erreurs qui peuvent arriver -->
---

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/:engineId/assetCategory/:_id/_link/parent/:parentId
Method: PUT
```

### Other protocols

```js
{
  "engineId": "<index>",
  "controller": "device-manager/assetCategory",
  "action": "linkParent"
}
```

---

## Arguments

- `engineId`: engine id
- `_id` : Asset Category that need to be linked
- `metadataId` : metadata Id that will be linked with asset category.

## Body properties

value of the metadata, if it's defined by category and not by assets

---

## Response

Returns an object with the following properties:

- `_id`: created document unique identifier
- `_source`: assetCategory document content
- `_version`: version of the updated document

Return has same caracteristics as update API action. More information at [document:update](/core/2/api/controllers/document/update).

