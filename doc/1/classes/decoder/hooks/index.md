---
code: false
type: page
title: Hooks
description: Decoder abstract class lifecycle hooks
---

# Hooks

Hooks allow to modify the processing of a payload and its propagation into the associated collections.

## `beforeProcessing`

Lifecycle hook executed before processing the payload but after validation

---

```ts
async beforeProcessing (payload: JSONObject, request: KuzzleRequest): Promise<void>
```

<br/>

| Arguments | Type                     | Description                                 |
|-----------|--------------------------|---------------------------------------------|
| `payload` | <pre>JSONObject</pre>    | Raw payload received in the API action body |
| `request` | <pre>KuzzleRequest</pre> | Original request                            |

## `beforeRegister`

Lifecycle hook executed before a device is registered

---

```ts
async beforeRegister (device: Device, request: KuzzleRequest): Promise<Device>
```

<br/>

| Arguments | Type                     | Description                   |
|-----------|--------------------------|-------------------------------|
| `device`  | <pre>Device</pre>        | Device before being persisted |
| `request` | <pre>KuzzleRequest</pre> | Original request              |

### Returns

Returns the enriched device document.

## `beforeUpdate`

Lifecycle hook executed before a device is updated

---

```ts
async beforeUpdate (device: Device, request: KuzzleRequest): Promise<Device>
```

<br/>

| Arguments | Type                     | Description                 |
|-----------|--------------------------|-----------------------------|
| `device`  | <pre>Device</pre>        | Device before being updated |
| `request` | <pre>KuzzleRequest</pre> | Original request            |

### Returns

Returns the enriched device document.

## `afterRegister`

Hook executed after registering a device.
The value returned by this method will be used as the API action result.

By default, the device document content is returned.

---

```ts
async afterRegister (device: Device, request: KuzzleRequest): Promise<Device>
```

<br/>

| Arguments | Type                     | Description                  |
|-----------|--------------------------|------------------------------|
| `device`  | <pre>Device</pre>        | Device after being persisted |
| `request` | <pre>KuzzleRequest</pre> | Original request             |

### Returns

Result of the corresponding API action.

## `afterUpdate`

Hook executed after updating a device.
The value returned by this method will be used as the API action result.

By default, the device document content is returned.

---

```ts
async afterUpdate (device: Device, request: KuzzleRequest): Promise<Device>
```

<br/>

| Arguments | Type                     | Description                  |
|-----------|--------------------------|------------------------------|
| `device`  | <pre>Device</pre>        | Device after being persisted |
| `request` | <pre>KuzzleRequest</pre> | Original request             |

### Returns

Result of the corresponding API action.
