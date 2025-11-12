---
code: true
type: page
title: route
description: Redirect to corresponding decoder
---

# Route

Redirects payload to corresponding decoder determined by deviceModel.

## Query Syntax

### HTTP

```http
URL: http://kuzzle:7512/_/device-manager/decoders/route
Method: POST
```

### Other protocols

```js
{
  "controller": "device-manager/decoders",
  "action": "route",
  "body":{
    "deviceModel":"string",
    ...rest of the device payload
  }
}
```
---

## Body Arguments

- `deviceModel`:  device model of the payload.

---

## Response

```js
{
  "status": 200,
  "error": null,
  "controller": "device-manager/decoders",
  "action": "route",
  "requestId": "<unique request identifier>",
  "result": {
    "valid":true
  }
}
```

## Implementation

This route is typically used when we need a unique endpoint for an IoT gateway.

It needs the field `deviceModel` to redirect the payload to the correct decoder, if you need to check the available device models of your application you can list them with the "device-manager/decoders:route" action. 

If you can not configure your gateway to add this field you can use a pipe to enrich the payloads before they are treated by the controller. 

In the following example a gateway refers the constructor and model of the device in a `metadata` object in every sent payload:

``` typescript
 this.app.pipe.register(
      'device-manager/decoders:beforeRoute',
      async (request: KuzzleRequest) => {
        const body = request.getBody();
        // We build the deviceModel field from the metadata sent by the gateway
        const constructor = body?.metadata.constructor;
        const model = body?.metadata.model;
        if (constructor && model) {
          const deviceModel = constructor + model
          this.app.log.info(`Identified device model: ${deviceModel}`);

          // We then add this deviceModel to the body of the request
          request.input.body.deviceModel = deviceModel;
        } else {
            this.app.log.warn(
              `Could not find device model`,
            );
          }
        return request;
      },
    );
```