---
code: false
type: page
title: Create an application using KDM
description: Create an application using KDM
order: 000
---

# Represent assets and get measures

To create a new application using KDM, first use ou CLI `kourou`:

```sh
npm install -g kourou # Install our CLI
kourou app:scaffold kdm-application
cd kdm-application

npm install kuzzle-device-manager
npm run docker:reinstall
```

In our application class at `lib/MyApplication.ts`, modify the constructor to use the plugin

```ts
import { DeviceManagerPlugin } from 'kuzzle-device-manager';

// ...

  constructor () {
    super('my-application');
    const deviceManager = new DeviceManagerPlugin();
    this.plugin.use(deviceManager);
  }
```

You will now be able to program your KDM application !
