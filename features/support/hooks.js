'use strict';

const _ = require('lodash');
const { After, Before, BeforeAll } = require('cucumber');
const { Kuzzle, WebSocket } = require('kuzzle-sdk');

const defaultMappings = require('../fixtures/mappings');
const defaultFixtures = require('../fixtures/fixtures');
const defaultRights = require('../fixtures/rights');

const World = require('./world');

async function resetEngine (sdk, index) {
  await sdk.query({
    controller: 'device-manager/engine',
    action: 'delete',
    index,
  }).catch(() => {});

  await sdk.query({
    controller: 'device-manager/engine',
    action: 'create',
    index,
  });
}

BeforeAll({ timeout: 30 * 1000 }, async function () {
  const world = new World({});

  world.sdk = new Kuzzle(
    new WebSocket(world.host, { port: world.port })
  );

  console.log(`Connecting to Kuzzle at ${world.host}:${world.port}..`);

  await world.sdk.connect();

  await world.sdk.query({
    controller: 'admin',
    action: 'loadSecurities',
    body: defaultRights,
    refresh: 'wait_for',
    onExistingUsers: 'overwrite',
  });

  await world.sdk.query({
    controller: 'admin',
    action: 'loadMappings',
    body: defaultMappings,
    refresh: 'wait_for'
  });

  await Promise.all([
    resetEngine(world.sdk, 'tenant-ayse'),
    resetEngine(world.sdk, 'tenant-kuzzle'),
  ]);

  world.sdk.disconnect();
});

Before({ timeout: 30 * 1000 }, async function () {
  this.props.now = Date.now();
  this.props.i = 1;

  this.sdk = new Kuzzle(
    new WebSocket(this.host, { port: this.port })
  );

  await this.sdk.connect();

  await Promise.all([
    truncateCollection(this.sdk, 'administration', 'devices'),

    truncateCollection(this.sdk, 'tenant-kuzzle', 'assets'),
    truncateCollection(this.sdk, 'tenant-kuzzle', 'devices'),

    truncateCollection(this.sdk, 'tenant-ayse', 'assets'),
    truncateCollection(this.sdk, 'tenant-ayse', 'devices'),
  ]);

  await this.sdk.query({
    controller: 'admin',
    action: 'loadFixtures',
    body: defaultFixtures,
    refresh: 'wait_for'
  });
});

After(async function () {
  // Clean values stored by the scenario
  this.props = {};

  if (this.sdk && typeof this.sdk.disconnect === 'function') {
    this.sdk.disconnect();
  }
});

// security hooks ==============================================================

After({ tags: '@security', timeout: 60 * 1000 }, async function () {
  await resetSecurityDefault(this.sdk);
});

async function resetSecurityDefault(sdk) {
  await sdk.query({
    controller: 'admin',
    action: 'resetSecurity',
    refresh: 'wait_for'
  });

  sdk.jwt = null;

  await sdk.query({
    controller: 'admin',
    action: 'loadSecurities',
    body: defaultRights,
    refresh: 'wait_for',
    onExistingUsers: 'overwrite',
  });
}

// realtime hooks ==============================================================

After({ tags: '@realtime' }, function () {
  if (_.isEmpty(this.props.subscriptions)) {
    throw new Error('@realtime time has been set but no subscriptions have been made.');
  }

  const promises = Object.values(this.props.subscriptions)
    .map(({ unsubscribe }) => unsubscribe());

  return Promise.all(promises);
});

async function truncateCollection (sdk, index, collection) {
  return sdk.collection.refresh(index, collection)
    .then(() => sdk.document.deleteByQuery(index, collection, {}, { refresh: 'wait_for' }))
    .catch(error => {
      if (! error.message.includes('does not exist')) {
        throw error;
      }
    })
}
