---
code: true
type: page
title: updateModelLocales
description: Update all assets localization
---

# update

Update all existing assets localization.

The `updateModelLocales` operation allows you to update the `locales` of all `assets` related to the specified `asset model`.
The process retrieve the locales values stored in the asset model and update the locales of all the assets with these values. For the moment, this operation has to be done `manually` when the asset model locales changed to make the `search` operation on assets to `be up to date` so it takes also the new locales.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/assets/modelLocales?model=<modelName>
Method: PATCH
```

## Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "updateModelLocales",
  "model": "<modelName>"
}
```

## Arguments

- `model`: asset model

## Response

```js
{
  "action": "updateModelLocales",
  "controller": "device-manager/assets",
  "error": null,
  "headers": {},
  "node": "knode-madly-nightingale-17701",
  "requestId":"cc7a6ba4-7208-483e-a65c-b95508f7c4cb",
  "result": [
    {
      "engineIndex": "engine-ayse",
      "result": {
        "errors": [],
        "successes": []
      }
    },
    {
      "engineIndex": "engine-kuzzle",
      "result": {
        "errors": [],
        "successes": []
      }
    },
    {
      "engineIndex": "engine-other-group",
      "result": {
        "errors": [],
        "successes": []
      }
    }
    ],
  "status": 200,
  "volatile": null
}
```
