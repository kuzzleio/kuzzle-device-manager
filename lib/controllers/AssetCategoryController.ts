import { KuzzleRequest, Plugin } from 'kuzzle';
import { RelationalController } from './RelationalController';
import { AssetCategoryContent, FormattedValue, ProcessedAssetCategoryContent } from '../types/AssetCategoryContent';
import { AssetCategoryService } from '../core-classes/AssetCategoryService';


export class AssetCategoryController extends RelationalController {
  private assetCategoryService: AssetCategoryService;

  constructor (plugin: Plugin, assetCategoryService : AssetCategoryService) {
    super(plugin, 'asset-category');
    this.assetCategoryService = assetCategoryService;

    global.app.errors.register('device-manager', 'relational', 'forbiddenParent', {
      class: 'BadRequestError',
      description: 'you can\'t have a parent that is a subcategory',
      message: 'you can\'t have a parent that is a subcategory',
    });

    /* eslint-disable sort-keys */
    this.definition = {
      actions: {
        get: {
          handler: this.get.bind(this),
          http: [{ path: 'device-manager/:engineId/assetCategory', verb: 'get' }],
        },
        create: {
          handler: this.create.bind(this),
          http: [{ path: 'device-manager/:engineId/assetCategory', verb: 'post' }],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [{ path: 'device-manager/:engineId/assetCategory/:_id', verb: 'delete' }],
        },
        update: {
          handler: this.update.bind(this),
          http: [{ path: 'device-manager/:engineId/assetCategory/:_id', verb: 'put' }],
        },
        linkMetadata: {
          handler: this.linkMetadata.bind(this),
          http: [{ path: 'device-manager/:engineId/assetCategory/:_id/_link/metadata/:metadataId', verb: 'put' }],
        },
        unlinkMetadata: {
          handler: this.unlinkMetadata.bind(this),
          http: [{ path: 'device-manager/:engineId/assetCategory/:_id/_unlink/metadata/:metadataId', verb: 'delete' }],
        },
        linkParent: {
          handler: this.linkParent.bind(this),
          http: [{ path: 'device-manager/:engineId/assetCategory/:_id/_link/parent/:parentId', verb: 'put' }],
        },
        unlinkParent: {
          handler: this.unlinkParent.bind(this),
          http: [{ path: 'device-manager/:engineId/assetCategory/:_id/_unlink/parent/:parentId', verb: 'delete' }],
        }
      },
    };
  }


  async create (request: KuzzleRequest) {
    request.input.resource._id = request.input.body.name;
    let metadataValues = request.input.body.metadataValues;
    let assetMetadata = request.input.body.assetMetadata;
    if (! assetMetadata) {
      request.input.body.assetMetadata = [];
    }
    if (! metadataValues) {
      request.input.body.metadataValues = [];
    }
    else {
      const metadataValuesTable = [];
      for (const [key, value] of Object.entries(metadataValues)) {
        metadataValuesTable.push({ key, value });
      }
      request.input.body.metadataValues = metadataValuesTable;

    }
    return super.create(request);
  }

  async update (request: KuzzleRequest) {
    return super.genericUpdate(request);
  }

  async delete (request: KuzzleRequest) {
    const linkedAsset = this.getFieldPath(request, 'category', null, 'assets');
    const children = this.getFieldPath(request, 'parent');
    return super.genericDelete(request, [], [], [linkedAsset, children]);
  }

  async linkParent (request: KuzzleRequest) {
    const parent = request.getString('parentId');
    const document = await this.sdk.document.get(request.getString('engineId'), 'asset-category', parent);
    if (document._source.parentId) {
      throw global.app.errors.get('device-manager', 'assetController', 'forbiddenParent');
    }
    request.input.body = {
      parent
    };
    return this.update(request);
  }

  async unlinkParent (request: KuzzleRequest) {
    request.input.body = {
      'parent': null
    };
    return this.update(request);
  }
  
  async unlinkMetadata (request: KuzzleRequest) {
    const id = request.getId();
    const engineId = request.getString('engineId');
    const metadataId = request.getString('metadataId');
    const category = await this.sdk.document.get<AssetCategoryContent>(engineId, 'asset-category', id);
    const updatedMetadata = category._source.assetMetadata.filter(ownedMetadataId => ownedMetadataId !== metadataId);
    request.input.body = {
      assetMetadata: updatedMetadata
    };
    return this.update(request);
  }

  async linkMetadata (request: KuzzleRequest) {
    const id = request.getId();
    const engineId = request.getString('engineId');
    const metadataId = request.getString('metadataId');
    const value = request.input.body?.value;

    await this.sdk.document.get(engineId, 'metadata', metadataId); //existance verification
    const category = await this.sdk.document.get<AssetCategoryContent>(engineId, 'asset-category', id);
    const metadata = category._source.assetMetadata ? category._source.assetMetadata : [];
    let metadataValues = category._source.metadataValues;

    if (metadata.includes(metadataId)) {
      throw global.app.errors.get('device-manager', 'relational', 'linkAlreadyExist');
    }
    metadata.push(metadataId);
    request.input.body = {
      assetMetadata: metadata
    };
    let update = false;
    if (value) {
      const formattedValue : FormattedValue = await this.assetCategoryService.formatValue(value);
      if (metadataValues) {
        for (const metadataValue of metadataValues) {
          if (metadataValue.key === metadataId) {
            metadataValue.value = formattedValue;
            update = true;
          }
        }
      }
      else {
        metadataValues = [];
      }
      if (! update) {
        metadataValues.push({ key: metadataId, value: formattedValue });
      }
      request.input.body.metadataValues = metadataValues;
    }
    return this.update(request);
  }
  
  async get (request: KuzzleRequest) : Promise<ProcessedAssetCategoryContent> {
    const id = request.getId();
    const engineId = request.getString('engineId');
    const category = await this.sdk.document.get<AssetCategoryContent>(engineId, 'asset-category', id); //TODO : split assetCategorycontent with one for bdd mapping and one for get return 
    const source = category._source;
    const [assetMetadata, metadataValues] = await Promise.all([
      this.assetCategoryService.getMetadata(source, engineId),
      this.assetCategoryService.getMetadataValues(source, engineId)
    ]
    );

    const formattedAssetMetadata = await this.assetCategoryService.formatMetadataForGet(metadataValues);
    const processedAssetCategoryContent :ProcessedAssetCategoryContent = {
      name: source.name,
      parent: source.parent,
      assetMetadata,
      metadataValues: formattedAssetMetadata
    };
    return processedAssetCategoryContent;
  }
}