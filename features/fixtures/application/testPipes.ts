import _ from 'lodash';
import { Backend, KuzzleRequest } from "kuzzle";

export function registerTestPipes (app: Backend) {
  app.pipe.register(`engine:engine-ayse:asset:measures:new`, async (request: KuzzleRequest) => {
    if (request.result.asset._id !== 'MART-linked') {
      return request;
    }

    request.result.asset._source.metadata = {
      enriched: true,
      measureTypes: request.result.measureTypes
    };

    return request;
  });

  app.pipe.register('device-manager:device:update:before', async ({ device, updates }) => {
    app.log.debug('before device update triggered');

    _.set(updates, 'metadata.enrichedByBeforeUpdateDevice', true);

    return { device, updates };
  })

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

  app.pipe.register('device-manager:device:provisioning:before', async ({ device, adminCatalog, engineCatalog }) => {
    app.log.debug('before provisioning trigered');

    _.set(device, '_source.metadata.enrichedByBeforeProvisioning', true);

    return { device, adminCatalog, engineCatalog };
  })


  app.pipe.register('device-manager:device:provisioning:after', async ({ device, adminCatalog, engineCatalog }) => {
    app.log.debug('after provisioning trigered');

    if (device._source.metadata.enrichedByBeforeProvisioning) {
      _.set(device, '_source.metadata.enrichedByAfterProvisioning', true);

      await app.sdk.document.update(
        'device-manager',
        'devices',
        device._id,
        device._source,
      );
    }

    return { device, adminCatalog, engineCatalog };
  })

  app.pipe.register('device-manager:device:link-asset:before', async ({ device, asset }) => {
    app.log.debug('before link-asset triggered');

    _.set(asset, 'body.metadata.enrichedByBeforeLinkAsset', true);

    return { device, asset };
  })

  app.pipe.register('device-manager:device:link-asset:after', async ({ device, asset }) => {
    app.log.debug('after link-asset triggered');

    return { device, asset };
  })

  app.pipe.register('device-manager:device:attach-engine:before', async ({ index, device }) => {
    app.log.debug('before attach-engine trigered');

    _.set(device, 'body.metadata.enrichedByBeforeAttachengine', true);

    return { index, device };
  })

  app.pipe.register('device-manager:device:attach-engine:after', async ({ index, device }) => {
    app.log.debug('after attach-engine trigered');

    if (device.body.metadata.enrichedByBeforeAttachengine) {
      _.set(device, 'body.metadata.enrichedByAfterAttachengine', true);

      await app.sdk.document.update(
        device.body.engineId,
        'devices',
        device._id,
        device.body
      );

    }

    return { index, device };
  });

  app.pipe.register('device-manager:asset:update:before', async ({ asset, updates }) => {
    app.log.debug('before asset update triggered');

    _.set(updates, 'metadata.enrichedByBeforeAssetUpdate', true);

    return { asset, updates };
  });

  app.pipe.register('device-manager:asset:update:after', async ({ asset, updates }) => {
    app.log.debug('after asset update triggered');

    if (updates.metadata.enrichedByBeforeAssetUpdate) {
      _.set(updates, 'metadata.enrichedByAfterAssetUpdate', true);

      await app.sdk.document.update(
        updates.metadata.index,
        'assets',
        asset._id,
        updates,
      )
    }

    return { asset, updates };
  });
}