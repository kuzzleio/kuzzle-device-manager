---
code: true
type: page
title: updateModelLocales
description: Update all assets localization
---

# update

Update all existing assets localization.

The `updateModelLocales` operation allows you to update the `locales` of all `assets` related to the specified `asset model`.
The process retrieve the locales values stored in the asset model and update the locales of all the assets with these values. For the moment, this operation has to be done `manually` when the asset model locales changed to make the `search` operation on assets to `be up to date`.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/assets/modelLocales
Method: PUT
```

## Other protocols

```js
{
  "controller": "device-manager/assets",
  "action": "updateModelLocales",
  "model": "Container",
  "engineGroup": "commons"
}
```

## Arguments

- `engineGroup`: Engine group
- `model`: asset model

## Response

```js
{
	"action": "updateModelLocales",
	"collection": "assets",
	"controller": "device-manager/assets",
	"error": null,
	"headers": {},
	"index": "engine-ayse",
	"node": "knode-gigantic-iago-99422",
	"requestId": "3b86b6d1-8004-4273-ba03-94526b019b8a",
	"status": 200,
	"volatile": null
}
```
