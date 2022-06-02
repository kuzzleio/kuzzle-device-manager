import csv from 'csvtojson';
import { CRUDController } from 'kuzzle-plugin-commons';
import {
  BadRequestError,
  KuzzleRequest,
  Plugin,
} from 'kuzzle';

import { BaseAsset } from '../models/BaseAsset';
import { AssetService, DeviceService } from '../core-classes';
import { AssetCategoryService } from '../core-classes/AssetCategoryService';
import { AssetCategoryContent } from '../types/AssetCategoryContent';

export class AssetController extends CRUDController {
  private assetService: AssetService;
  private deviceService: DeviceService;
  private assetCategoryService: AssetCategoryService;

  private get sdk () {
    return this.context.accessors.sdk;
  }


  constructor (plugin: Plugin, assetService: AssetService, deviceService : DeviceService, assetCategoryService : AssetCategoryService) {
    super(plugin, 'assets');
    global.app.errors.register('device-manager', 'assetController', 'MandatoryMetadata', {
      class: 'BadRequestError',
      description: 'Metadata which are specified in AssetCategory as mandatory must be present',
      message: 'metadata %s is mandatory for the asset',
    });
    global.app.errors.register('device-manager', 'assetController', 'MandatoryMetadata', {
      class: 'BadRequestError',
      description: 'Metadata which are specified in AssetCategory as mandatory must be present',
      message: 'metadata %s is mandatory for the asset',
    });
    this.assetCategoryService = assetCategoryService;
    this.assetService = assetService;
    this.deviceService = deviceService;
    /* eslint-disable sort-keys */
    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ path: 'device-manager/:engineId/assets', verb: 'post' }],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [{ path: 'device-manager/:engineId/assets/:_id', verb: 'delete' }],
        },
        importAssets: {
          handler: this.importAssets.bind(this),
          http: [{ path: 'device-manager/:engineId/assets/_import', verb: 'post' }]
        },
        search: {
          handler: this.search.bind(this),
          http: [
            { path: 'device-manager/:engineId/assets/_search', verb: 'post' },
            { path: 'device-manager/:engineId/assets/_search', verb: 'get' },
          ],
        },
        update: {
          handler: this.update.bind(this),
          http: [{ path: 'device-manager/:engineId/assets/:_id', verb: 'put' }],
        },
        measures: {
          handler: this.measures.bind(this),
          http: [{ path: 'device-manager/:engineId/assets/:_id/measures', verb: 'get' }],
        },
        linkCategory: {
          handler: this.linkCategory.bind(this),
          http: [{ path: 'device-manager/:engineId/assets/:_id/_link/category/:categoryId', verb: 'put' }],
        },
        unlinkCategory: {
          handler: this.unlinkCategory.bind(this),
          http: [{ path: 'device-manager/:engineId/assets/:_id/_unlink/category/:categoryId', verb: 'delete' }],
        },
      },
    };
    /* eslint-enable sort-keys */
  }

  async measures (request: KuzzleRequest) {
    const id = request.getId();
    const engineId = request.getString('engineId');
    const size = request.input.args.size;
    const startAt = request.input.args.startAt;
    const endAt = request.input.args.endAt;
    if (size && startAt || size && endAt) {
      throw new BadRequestError('You cannot specify both a "size" and a "startAt" or "endAt"');
    }
    const measures = await this.assetService.measureHistory(
      engineId,
      id,
      { endAt, size, startAt });

    return { measures };
  }

  async unlinkCategory (request: KuzzleRequest) {
    const id = request.getId();
    const engineId = request.getString('engineId');
    const document = await this.sdk.document.get(engineId, this.collection, id);
    const updateRequest = { category: null, subCategory: null };
    if ( document._source.category === request.getString('categoryId') || document._source.subCategory === request.getString('categoryId') ) {
      request.input.body = updateRequest;
      return this.update(request);
    } 
    throw global.app.errors.get('device-manager', 'relational', 'removeUnexistingLink');
    
  }

  async linkCategory (request: KuzzleRequest) { //TODO : verify mandatory metadata (for later)
    const id = request.getId();
    const engineId = request.getString('engineId');
    const document = await this.sdk.document.get(engineId, this.collection, id);
    const categoryDocument = await this.sdk.document.get(engineId, 'asset-category', request.getString('categoryId')); 
    const updateRequest = { 
      category: null,
      subCategory: null
    };
    if ( document._source.category) {
      throw global.app.errors.get('device-manager', 'relational', 'alreadyLinked', 'asset', 'category');
    }
    else if (categoryDocument._source.parent) {
      updateRequest.category = categoryDocument._source.parent.name;
      updateRequest.subCategory = request.getString('categoryId');
    }
    else {
      updateRequest.category = request.getString('categoryId');

    } 
    request.input.body = updateRequest;
    return this.update(request);
  }

  async update (request: KuzzleRequest) {
    const id = request.getId();
    const engineId = request.getString('engineId');
    const body = request.getBody();
    const asset = await this.sdk.document.get(engineId, this.collection, id);

    const response = await global.app.trigger(
      'device-manager:asset:update:before', {
        asset,
        updates: body });

    request.input.args.index = engineId;
    request.input.body = response.updates;

    const result = await super.update(request);

    await global.app.trigger('device-manager:asset:update:after', {
      asset,
      updates: result._source,
    });

    return result;
  }

  async create (request: KuzzleRequest) {
    const engineId = request.getString('engineId');
    
    const type = request.getBodyString('type');
    const model = request.getBodyString('model');
    const reference = request.getBodyString('reference');
    const category = request.getBody().category;

    if (category) {
      const assetMetadata = request.getBodyObject('metadata');
      if (assetMetadata) {
        await this.assetCategoryService.validateMetadata(assetMetadata, engineId, category);
      }
      const assetCategory = await this.sdk.document.get<AssetCategoryContent>(engineId, 'asset-category', category);
      const values = this.assetCategoryService.getMetadataValues(assetCategory._source);
      request.input.body.metadata = { ...assetMetadata, ...values };
    }
    else {
      request.input.body.category = null;
    }
    if (! request.input.args._id) {
      request.input.args._id = BaseAsset.id(type, model, reference);
    }

    request.input.args.index = engineId;
    request.input.body.measures = [];
    request.input.body.deviceLinks = [];

    request.input.body.measures = [];

    return super.create(request);

  }

  async importAssets (request: KuzzleRequest) {
    const engineId = request.getString('engineId');
    const content = request.getBodyString('csv');

    const assets = await csv({ delimiter: 'auto' }).fromString(content);

    const results = await this.assetService.importAssets(
      engineId,
      assets,
      {
        options: { ...request.input.args },
        strict: true
      });

    return results;
  }

  async delete (request: KuzzleRequest) {
    const engineId = request.getString('engineId');
    request.input.args.index = engineId;
    const assetId = request.getId();
    const refresh = request.getRefresh();
    const strict = request.getBoolean('strict');
    const devicesLinks = await this.assetService.getAsset(engineId, assetId);
    if (Array.isArray(devicesLinks._source.deviceLinks)) {
      for (const deviceLink of devicesLinks._source.deviceLinks) {
        await this.deviceService.unlinkAsset(deviceLink.deviceId, { refresh, strict });
      }
    }
    return super.delete(request);
  }
}
