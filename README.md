# Device manager

This plugin provides the necessary APIs to manage a fleet of devices linked to assets.

It allows to decode the payloads received for the different device models of the application.

It works in a multi-tenant mode where each tenant has its own devices and assets.

## Usage

In proper way to use this library in your program as an NPM module, you need to be authenticate to Github Package NPM registry using your Github username and a [Personal Access Token](https://github.com/settings/tokens):
```sh
npm login --scope=@kuzzleio --registry=https://npm.pkg.github.com
# Username: yourUsername
# Password: yourPersonalAccessToken
# Email: (this IS public): yourPublicEmail
```
Once done, you can install it and add it to your project dependencies:
```
npm install @kuzzleio/plugin-workflows --save 
```

## Documentation

### Online

Open [https://docs.kuzzle.io/kuzzle-iot-platform/device-manager/1](https://docs.kuzzle.io/kuzzle-iot-platform/device-manager/1)

### Locally

```bash
npm run doc:prepare
npm run doc:dev
```

Open [http://localhost:8080](http://localhost:8080)
