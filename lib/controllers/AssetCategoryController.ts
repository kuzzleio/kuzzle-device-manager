import { KuzzleRequest, Plugin } from 'kuzzle';
import { FieldPath, RelationalController } from './RelationalController';

export class AssetCategoryController extends RelationalController {
  constructor (plugin: Plugin) {
    super(plugin, 'asset-category');
    RelationalController.classMap.set('asset-category', this);

    global.app.errors.register('device-manager', 'relational', 'forbiddenParent', {
      class: 'BadRequestError',
      description: 'you can\'t have a parent that is a subcategory',
      message: 'you can\'t have a parent that is a subcategory',
    });

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
        linkMetadata: {
          handler: this.linkMetadata.bind(this),
          http: [{ path: 'device-manager/:engineId/assetCategory/:_id/_link/metadata/:_metadataId', verb: 'put' }],
        },
        unlinkMetadata: {
          handler: this.unlinkMetadata.bind(this),
          http: [{ path: 'device-manager/:engineId/assetCategory/:_id/_unlink/metadata/:_metadataId', verb: 'delete' }],
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
  
  private getFieldPath (request : KuzzleRequest, fieldName : string, documentKey : string = '_id', collectionName : string = 'asset-category', indexKey : string = 'engineId', ): FieldPath {
    return {
      index: indexKey ? request.getString(indexKey) : null,
      collection: collectionName,
      document: documentKey ? request.getString(documentKey) : null,
      field: fieldName
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
    const id = request.getId();

    //First, if it has children, we must remove them
    const element = await this.getDocumentContent(this.getFieldPath(request, null));
    const linkedAsset = this.getFieldPath(request, 'category', null, 'assets');
    if (element.children) {
      for (const child of element.children) {
        request.input.args._id = child.document;
        await this.delete (request); //TODO : Promise.all
      }
      request.input.args._id = id;
    }
    return super.genericDelete(request, [], [], [linkedAsset]);
  }

  async linkParent (request: KuzzleRequest) {
    const document = await this.sdk.document.get(request.getString('engineId'), 'asset-category', request.getString('parentId'));
    if (document._source.parentId) {
      throw global.app.errors.get('device-manager', 'assetController', 'forbiddenParent');
    }
    const embeddedAssetCategory = this.getFieldPath(request, 'children', 'parentId');
    const assetCategoryContainer = this.getFieldPath(request, 'parent');
    return super.genericLink(request, embeddedAssetCategory, assetCategoryContainer, false);
  }

  async unlinkParent (request: KuzzleRequest) {

    const embeddedAssetCategory = this.getFieldPath(request, 'children', 'parentId');
    const assetCategoryContainer = this.getFieldPath(request, 'parent');
    return super.genericUnlink(request, embeddedAssetCategory, assetCategoryContainer, false);
  }

  async linkMetadata (request: KuzzleRequest) {

    const embeddedMetadata = this.getFieldPath(request, 'AssetCategory', '_metadataId', 'metadata');
    const assetCategoryContainer = this.getFieldPath(request, 'assetMetadatas');
    return super.genericLink(request, embeddedMetadata, assetCategoryContainer, true);
  }

  async unlinkMetadata (request: KuzzleRequest) {

    const embeddedMetadata = this.getFieldPath(request, 'AssetCategory', '_metadataId', 'metadata');
    const assetCategoryContainer = this.getFieldPath(request, 'assetMetadatas');
    return super.genericUnlink(request, embeddedMetadata, assetCategoryContainer, true);
  }

}