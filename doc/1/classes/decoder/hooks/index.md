---
code: false
type: page
title: Hooks
description: Decoder abstract class lifecycle hooks
---

# Hooks

Hooks allows to modify the processing of a payload and it's propagation into the associated collections.

## `beforeRegister`

Lifecycle hook triggered before a sensor is registered

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

Lifecycle hook triggered before a sensor is updated

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
Return value of this method will be returned in the API action result.

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
Return value of this method will be returned in the API action result.

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
