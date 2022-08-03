---
code: false
type: page
title: Assets Category
description: Asset Category document
order: 110
---


# Assets

An assetCategory document represents a category of assets. 

An assetCategory contain metadata information about assets of the category. The value of the metadata can be given by the asset, or in some case, by the assetCategory, if all assets of the category have the same value for the metadata. 

An assetCategory can have a parent and, like with Object-oriented programming, it inherit caracteristics of its parent.

You can have a clean and complete representation of an assetCategory using the get function of the assetCategory Controller 

**Example:** _Clean representation of an assetCategory given by a get_
```js
{
  "name": "example",
  "assetMetadata": [
    {
      "mandatory": false,
      "name": "position",
      "valueType": "geo_point"
    },
    {
      "mandatory": true,
      "name": "color",
      "valueList": [
        "red",
        "blue",
        "green"
      ],
      "valueType": "enum"
    },
    {
      "mandatory": true,
      "name": "surname",
      "valueType": "string"
    }
  ],
  "metadataValues": {
    "surname": "test"
  }
}
```

**Example:** _ElasticSearch representation of an assetCategory given by standard Kuzzle API_
```js
{
  "name": "T3",
  "assetMetadata": [
    "position",
    "color",
    "surname"
  ],
  "metadataValues": [
    {
      "value": {
        "keyword": "test"
      },
      "key": "surname"
    }
  ]
}
```



