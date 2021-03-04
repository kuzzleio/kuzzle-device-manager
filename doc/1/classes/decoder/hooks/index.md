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

Lifecycle hook executed before a sensor is registered

---

```ts
async beforeRegister (sensor: Sensor, request: KuzzleRequest): Promise<Sensor>
```

<br/>

| Arguments | Type                     | Description                   |
|-----------|--------------------------|-------------------------------|
| `sensor`  | <pre>Sensor</pre>        | Sensor before being persisted |
| `request` | <pre>KuzzleRequest</pre> | Original request              |

### Returns

Returns the enriched sensor document.

## `beforeUpdate`

Lifecycle hook executed before a sensor is updated

---

```ts
async beforeUpdate (sensor: Sensor, request: KuzzleRequest): Promise<Sensor>
```

<br/>

| Arguments | Type                     | Description                 |
|-----------|--------------------------|-----------------------------|
| `sensor`  | <pre>Sensor</pre>        | Sensor before being updated |
| `request` | <pre>KuzzleRequest</pre> | Original request            |

### Returns

Returns the enriched sensor document.

## `afterRegister`

Hook executed after registering a sensor.
The value returned by this method will be used as the API action result.

By default, the sensor document content is returned.

---

```ts
async afterRegister (sensor: Sensor, request: KuzzleRequest): Promise<Sensor>
```

<br/>

| Arguments | Type                     | Description                  |
|-----------|--------------------------|------------------------------|
| `sensor`  | <pre>Sensor</pre>        | Sensor after being persisted |
| `request` | <pre>KuzzleRequest</pre> | Original request             |

### Returns

Result of the corresponding API action.

## `afterUpdate`

Hook executed after updating a sensor.
The value returned by this method will be used as the API action result.

By default, the sensor document content is returned.

---

```ts
async afterUpdate (sensor: Sensor, request: KuzzleRequest): Promise<Sensor>
```

<br/>

| Arguments | Type                     | Description                  |
|-----------|--------------------------|------------------------------|
| `sensor`  | <pre>Sensor</pre>        | Sensor after being persisted |
| `request` | <pre>KuzzleRequest</pre> | Original request             |

### Returns

Result of the corresponding API action.
