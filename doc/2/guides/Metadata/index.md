---
code: false
type: page
title: Metadata
description: Metadata document
order: 100
---


# Assets

A Metadata represent a data type that can be attached to an asset (or to an asset Category). 

A basic metadata contain only tree informations : it's name, it's type, and if it's mandatory or not.

**Example:** _Representation of a basic metadata_
```js
{
"name": "surname",
"valueType": "string",
"mandatory": true
}
```

A metadata can also contain a list of value that can be attached to it. 
These value can be string (like this example) :

**Example:** _Representation of a string metadata with list a legal value_
```js
{
  "name": "color",
    "valueType": "enum",
    "valueList": [
    "red",
    "blue",
    "green"
  ],
  "mandatory": true
}
```

These value can also be object (like this example) :

**Example:** _Representation of a string metadata with list a legal objects value_
```js
{
  "name": "trailer",
    "valueType": "enum",
    "mandatory": false,
    "objectValueList": [
    {
      "object": [
        {
          "key": "color",
          "value": {
            "keyword": "red"
          }
        },
        {
          "key": "size",
          "value": {
            "keyword": "giant"
          }
        },
        {
          "key": "maxLoad",
          "value": {
            "integer": 50
          }
        }
      ]
    },
    {
      "object": [
        {
          "key": "color",
          "value": {
            "keyword": "blue"
          }
        },
        {
          "key": "size",
          "value": {
            "keyword": "small"
          }
        },
        {
          "key": "maxLoad",
          "value": {
            "integer": 60
          }
        }
      ]
    }
  ]
}
```

A metadata can be linked to any number of asset category. 
If the metadata is mandatory, all asset that will be created with the assetCategory must have a value for this metadata.


