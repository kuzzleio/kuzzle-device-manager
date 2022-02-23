import _ from 'lodash';
import { Backend } from 'kuzzle';

function checkEventWithDocument (app: Backend, event: string) {
  app.pipe.register(event, async payload => {
    app.log.debug(`Event "${event}" triggered`);

    await app.sdk.document.createOrReplace('tests', 'events', event, payload);

    return payload;
  });
}

export function registerTestPipes (app: Backend) {
  checkEventWithDocument(app, 'device-manager:device:provisioning:before');
  checkEventWithDocument(app, 'device-manager:device:provisioning:after');
  checkEventWithDocument(app, 'device-manager:device:attach-engine:before');
  checkEventWithDocument(app, 'device-manager:device:attach-engine:after');

  // Used in PayloadController.feature
  app.pipe.register('engine:engine-ayse:asset:measures:new',
    async ({ asset, measures }) => {
        if (asset._id !== 'tools-MART-linked') {
          return { asset, measures };
        }

        asset._source.metadata = {
          enriched: true,
          measureTypes: measures.map(m => m.type),
        };

        return { asset, measures };
      });

  // Used in PayloadController.feature
  app.pipe.register('engine:engine-ayse:device:measures:new',
    async ({ device, measures }) => {
      if (device._id !== 'DummyTemp-attached_ayse_unlinked') {
        return { device, measures };
      }

      device._source.metadata = {
        enriched: true,
        measureTypes: measures.map(m => m.type),
      };

      return { device, measures };
    });

  app.pipe.register('device-manager:device:update:before', async ({ device, updates }) => {
    app.log.debug('before device update triggered');

    _.set(updates, 'metadata.enrichedByBeforeUpdateDevice', true);

    return { device, updates };
  });

  app.pipe.register('device-manager:device:update:after', async ({ device, updates }) => {
    app.log.debug('after device update triggered');


    if (updates.metadata.enrichedByBeforeUpdateDevice) {
      _.set(updates, 'metadata.enrichedByAfterUpdateDevice', true);

      await app.sdk.document.update(
        device._source.engineId,
        'devices',
        device._id,
        updates,
      );
    }


    return { device, updates };
  });

  app.pipe.register('device-manager:device:link-asset:before', async ({ device, asset }) => {
    app.log.debug('before link-asset triggered');

    _.set(asset, 'body.metadata.enrichedByBeforeLinkAsset', true);

    return { device, asset };
  });

  app.pipe.register('device-manager:device:link-asset:after', async ({ device, asset }) => {
    app.log.debug('after link-asset triggered');

    return { device, asset };
  });

  app.pipe.register('device-manager:device:attach-engine:before', async ({ engineId, device }) => {
    app.log.debug('before attach-engine trigered');

    _.set(device, 'body.metadata.enrichedByBeforeAttachengine', true);

    return { engineId, device };
  });

  app.pipe.register('device-manager:device:attach-engine:after', async ({ engineId, device }) => {
    app.log.debug('after attach-engine trigered');

    if (device.body.metadata.enrichedByBeforeAttachengine) {
      _.set(device, 'body.metadata.enrichedByAfterAttachengine', true);

      await app.sdk.document.update(
        device._source.engineId,
        'devices',
        device._id,
        device._source
      );
    }

    return { engineId, device };
  });
}