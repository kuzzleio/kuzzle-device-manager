import { KuzzleRequest, Plugin } from 'kuzzle';
import { FieldPath, RelationalController } from './RelationalController';

export class AssetCategoryController extends RelationalController {
  constructor (plugin: Plugin) {
    super(plugin, 'asset-category');
    RelationalController.classMap.set('asset-category', this);
    /* eslint-disable sort-keys */
    this.definition = {
      actions: {
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
        linkMedatadata: {
          handler: this.linkMetadata.bind(this),
          http: [{ path: 'device-manager/:engineId/assetCategory/:_id/_link/metadata/:_metadataId', verb: 'put' }],
        },
        unlinkMedatadata: {
          handler: this.unlinkMetadata.bind(this),
          http: [{ path: 'device-manager/:engineId/assetCategory/:_id/_unlink/metadata/:_metadataId', verb: 'delete' }], //TODO : enlever le _
        },
        linkParent: {
          handler: this.linkParent.bind(this),
          http: [{ path: 'device-manager/:engineId/assetCategory/:_id/_link/parent/:parentId', verb: 'put' }],
        },
        unlinkParent: {
          handler: this.unlinkParent.bind(this),
          http: [{ path: 'device-manager/:engineId/assetCategory/:_id/_unlink/parent/:parentId', verb: 'delete' }],
        }

        //TODO : link and unlink to a parent!!!!!
      },
    };
  }

  async create (request: KuzzleRequest) {
    request.input.resource._id = request.input.body.name;
    if (! request.input.body.children) {
      request.input.body.children = [];
    }
    return super.create(request);
  }

  async update (request: KuzzleRequest) {
    return super.genericUpdate(request, [], ['children']);
  }

  async delete (request: KuzzleRequest) {
    //return super.delete(request);
    const linkedAsset: FieldPath = {
      index: request.getString('engineId'),
      collection: 'assets',
      document: null,
      field: 'categories'
    };
    return super.genericDelete(request, null, ['children'], [linkedAsset]);
  }

  async linkParent (request: KuzzleRequest) {
    const embeddedAssetCategory: FieldPath = {
      index: request.getString('engineId'),
      collection: 'asset-category',
      document: request.getString('parentId'),
      field: 'children'
    };
    const assetCategoryContainer: FieldPath = {
      index: request.getString('engineId'),
      collection: 'asset-category',
      document: request.getString('_id'),
      field: 'parent'
    };
    //return super.link(request, embeddedAssetCategory, assetCategoryContainer);
    return super.genericLink(request, embeddedAssetCategory, assetCategoryContainer, false);
  }

  async unlinkParent (request: KuzzleRequest) {
    const embeddedAssetCategory: FieldPath = {
      index: request.getString('engineId'),
      collection: 'asset-category',
      document: request.getString('parentId'),
      field: 'children'
    };
    const assetCategoryContainer: FieldPath = {
      index: request.getString('engineId'),
      collection: 'asset-category',
      document: request.getString('_id'),
      field: 'parent'
    };
    return super.genericUnlink(request, embeddedAssetCategory, assetCategoryContainer, false);
  }

  async linkMetadata (request: KuzzleRequest) {
    const embeddedMetadata : FieldPath = {
      index: request.getString('engineId'),
      collection: 'metadata',
      document: request.getString('_metadataId'),
      field: 'AssetCategory'
    };
    
    const assetCategoryContainer : FieldPath = {
      index: request.getString('engineId'),
      collection: 'asset-category',
      document: request.getString('_id'),
      field: 'assetMetadatas' //TODO : cohérence minuscule/majuscule
    };
    //return super.linkV2(request, embeddedMetadata, assetCategoryContainer);
    return super.genericLink(request, embeddedMetadata, assetCategoryContainer, true);
  }

  async unlinkMetadata (request: KuzzleRequest) {
    const embeddedMetadata : FieldPath = {
      index: request.getString('engineId'),
      collection: 'metadata',
      document: request.getString('_metadataId'),
      field: 'AssetCategory'
    };

    const assetCategoryContainer : FieldPath = {
      index: request.getString('engineId'),
      collection: 'asset-category',
      document: request.getString('_id'),
      field: 'assetMetadatas'
    };
    return super.genericUnlink(request, embeddedMetadata, assetCategoryContainer, true);
  }

}