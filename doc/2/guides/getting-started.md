# Getting Started

## Install IoT Platform

First, you need to initialize and application with a frontend and a backend using the IoT Platform frameworks.

The easiest way is to use the [Github Template](https://github.com/kuzzleio/template-kiotp-project):

```bash
git clone https://github.com/kuzzleio/template-kiotp-project my-iot-project
```

This template is a monorepo containing both backend and frontend app and using Turborepo.

 - `apps/api` contains a backend application using Kuzzle and the IoT Backend framework.
 - `apps/web` contains a frontend application using Vue.js and the IoT Console framework
 - `docker-compose.yml` is a Docker Compose file to run the external services

You can run your IoT application with the following commands:

```bash
docker-compose up -d

turbo dev
```

This will run:
 - your backend application on [port 7512](http://localhost:7512) (which exposes a Kuzzle API)
 - your frontend application on [port 8080](http://localhost:8080)

## Setup your first tenant

Now, we need to setup a tenant group so then we can create our first tenant and our first user.

But before all of this, let's create the Platform Admin user:

```bash
kourou security:createUser '{
  "content": {
    "profileIds": ["admin"],
  },
  "credential": {
    "local": {
      "username": "platform-admin",
      "password": "password"
    }
  }
}'
```

### Declare a new tenant group

We need to declare a new tenant group in the backend by using the IoT Backend framework.
Tenant group are declared by setting up profiles in the Multi-Tenancy plugin, in this example we will setup a `smartcity` tenant group.

_You can see an example of this in the `apps/api/lib/modules/permissions/PermissionsModule.ts` file_

We will use the `multiTenancy.registerProfilesTemplates` method to register our profiles:

```js
import { ProfileTenantAdmin, ProfileTenantReader } from "@kuzzleio/iot-backend";
import { MultiTenancyPlugin } from "@kuzzleio/plugin-multi-tenancy";

// Retrieve the plugin from the application instance
const multiTenancy = app.plugin.get<MultiTenancyPlugin>("multi-tenancy");

// Register profiles for the "smartcity" tenant group
multiTenancy.registerProfilesTemplate("smartcity", {
  [ProfileTenantAdmin.name]: ProfileTenantAdmin.definition,
  [ProfileTenantReader.name]: ProfileTenantReader.definition,
});
```

`ProfileTenantAdmin` and `ProfileTenantReader` are predefined profiles available through the `@kuzzleio/iot-backend` package.

### Create a tenant

Now, we can create a tenant of type `smartcity`.

You can login to the IoT Console and navigate to ... to create a new tenant:
[screenshot]

Or you can use the command line:

```bash
kourou multi-tenancy/tenants:create -a name="buenos_aires" -a group="smartcity"
```

### Create an user

Once we have a tenant, we can create users inside it. Those users will be strictly restricted to their tenant data.

We will create an admin user for the tenant, the admin user will then be capable of creating new users by himself.

Still loggued in as the Platform Admin, you can navigate to ... to create a new user for the tenant:
[screenshot]

Now, you can login to the IoT Platform as your tenant user.

## Define a Device model

We will now define a new Device model with the associated Decoder in order to receive raw payloads.

### Decoder

First, you need to create a Decoder that will transform the raw payload into standardized measures.

For this, you need to extends the `Decoder` class and
  - define measure decoded by the Decoder
  - implements the `decode` method

The `decode` method take 2 parameters:
  - `decodedPayload` utility class to extract the measures
  - `payload` the raw payload as a JSONObject

Each measure should be extracted with the following informations:
  - device reference which acts as device unique identifier (e.g. `ABC123`)
  - measure type (e.g. `temperature`)
  - measure name (e.g. `temperature`)
  - measure timestamp of the measurement (e.g. `1675959435515`)
  - measure values (e.g. `21.2`)

_An example of the complete implementation can be found in the `apps/api/lib/modules/devices/` directory_

In this example, we will implements a Decoder to decode the following raw payload:
```js
{
  "deviceEUI": "ABC123",
  "temp": 21.2
}
```

Our Decoder will define an `temperature` measure of type `temperature`:

```js
import { JSONObject } from "kuzzle-sdk";
import { Decoder, DecodedPayload } from "kuzzle-device-manager";

export class AbeewayDecoder extends Decoder {
  public measures = [
    { name: "temperature", type: "temperature" },
  ] as const;

  async decode(
    decodedPayload: DecodedPayload<AbeewayDecoder>,
    payload: JSONObject
  ) {
    decodedPayload.addMeasurement<TemperatureMeasurement>(
      payload.devEUI, // device reference
      "temperature", // measure name
      {
        measureAt: Date.now(), // measure timestamp (we use the reception date as the measurement date)
        type: "temperature", // measure type
        values: {
          temperature: payload.temp, // measure value
        },
      }
    );

    return decodedPayload;
  }
}
```

Then we can define a new Device model associated with the Decoder we just wrote.

For this, we will use the Device Manager plugin:

```js
import { DeviceManagePlugin } from "kuzzle-device-manager";

const deviceManager = app.plugin.get<DeviceManagerPlugin>("device-manager");

deviceManager.models.registerDevice("Abeeway", {
  decoder: new AbeewayDecoder(),
});
```

Once registered, the new device model automatically exposes a HTTP route to send raw payloads:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  "http://localhost:7512/device-manager/payloads/abeeway"\
  --data '{"deviceEUI": "ABC123", "temp": 21.2 }'
```

You can now open the Orphans Device view of the IoT Console and see you newly created device.

_By default, the IoT Platform automatically create new devices when a payload is received for the first time._

[screenshot]

## Define an Asset model

To define an Asset model, we need to register it on the framework.

A model is declared with the following informations:
  - tenant group allowed to use the model
  - model name
  - accepted measures
  - metadata

We will define an Asset model of name `Room` which accept a `temperature` measure and a metadata indicating in which building the room is located.

_An example of the complete implementation can be found in the `apps/api/lib/modules/assets/` directory_

For this, we will use the Device Manager plugin:

```js
import { DeviceManagerPlugin } from "kuzzle-device-manager";

const deviceManager = app.plugin.get<DeviceManagerPlugin>("device-manager");

deviceManager.model.registerAsset(
  "smartcity",
  "Room",
  {
    measures: [
      {
        name: "temperature",
        type: "temperature",
      },
    ],
    metadataMappings: {
      building: { type: "keyword" },
    },
  }
);
```

## Create Device and Asset for a tenant

The initial setup of the IoT Platform is now finished, we have:
  - a tenant group `smartcity`
  - a device model `Abeeway`
  - an asset model `Room`

Now we will create a Device for our tenant.

Go into the Devices view:
  1) click "Create Device"
  2) choose the model `Abeeway`
  3) give the reference `123456`

[screenshot]

Then we will create an Asset:

Go into the Assets view:
  1) click "Create Asset"
  2) choose the model `Room`
  3) give the reference `school_hall`

[screenshot]

Finally, we need to link our Device to our Asset to allows the Device measures to characterize the Asset.

Go into our `Room-school_hall` Asset view:
  1) click "Link a Device"
  2) find the device by typing it's reference `123456`
  3) associate the Device `temperature` measure to the Asset `temperature` measure

[screenshot]

Now our Device is linked to the Asset, we can check the link by sending a raw payload to the Device:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  "http://localhost:7512/device-manager/payloads/abeeway"\
  --data '{"deviceEUI": "123456", "temp": 21.2 }'
```

We can see the measure in the Asset view:
[screenshot]

## Create a dashboard

Finally, we will create a dashboard to visualize the measure history of our Asset.

A dashboard is a collection of widgets who are responsible of displaying data.
You can change the size or position of each widget on the dashboard to create a visualization that fit your needs.

First, let's create some fake data by repeating the CURL to the raw payload endpoint:

```bash
# wait 1 sec between each request
curl -X POST \
  -H "Content-Type: application/json" \
  "http://localhost:7512/device-manager/payloads/abeeway"\
  --data '{"deviceEUI": "123456", "temp": 21.2 }'
```

Navigate to the Dashboards view and click "Create Dashboard":
  1) write the name "School Temperature"

[screenshot]

Then we will add our first widget, click on "Add Widget":
  1) select the graph widget
  2) select the `Room-school_entry` asset
  3) select the `temperature` measure

[screenshot]