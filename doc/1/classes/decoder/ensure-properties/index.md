---
code: true
type: page
title: ensureProperties
description: Decoder abstract class ensureProperties() method
---

# ensureProperties

Checks if the provided properties are present in the payload

A `BadRequestError` will be thrown if a property is missing.

```ts
ensureProperties (payload: JSONObject, paths: string[]): void | never
```

<br/>

| Arguments | Type                  | Description                                 |
|-----------|-----------------------|---------------------------------------------|
| `payload` | <pre>JSONObject</pre> | Raw payload received in the API action body |
| `paths`   | <pre>string[]</pre>   | Paths of properties (lodash style)          |
