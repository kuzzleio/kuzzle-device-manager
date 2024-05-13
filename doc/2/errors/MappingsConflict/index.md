---
code: false
type: page
title: Mappings Conflicts
description: Mappings Conflicts
---

# Mappings Conflicts

A `Mappings Conflicts` error is thrown in case the new model mappings types are conflicting with other models, it can be itself in case of an update or another model when creating a new one.

**HTTP status**: 409

**Additional Properties:**

| property | type             | description                                                                                                                                        |
| -------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chunks` | array of objects | List of conflicting models name and type, along an array of conflicts. <br> A conflict contains the new type and current type as well as its path. |

Here is an example of a `chunks` field:
```js
[
  {
    "conflicts": [
      {
        "currentType": "integer",
        "newType": "keyword",
        "path": "asset.metadataMappings.weight.type"
      },
      {
        "currentType": "integer",
        "newType": "keyword",
        "path": "asset.metadataMappings.height.type"
      }
    ],
    "modelType": "asset",
    "newModel": "Container",
    "sourceModel": "Container"
  },
  {
    "conflicts": [
      {
        "currentType": "keyword",
        "newType": "integer",
        "path": "asset.metadataMappings.company.type"
      }
    ],
    "modelType": "asset",
    "newModel": "Container",
    "sourceModel": "Plane"
  }
]
```