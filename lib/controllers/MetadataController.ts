import { JSONObject, KuzzleRequest, Plugin } from 'kuzzle';
import { RelationalController } from './RelationalController';
import { MetadataContent, ProcessedMetadataContent } from '../types/MetadataContent';
import { AssetCategoryService } from '../core-classes/AssetCategoryService';

export class MetadataController extends RelationalController {

  private assetCategoryService: AssetCategoryService;


  constructor (plugin: Plugin, assetCategoryService : AssetCategoryService) {
    super(plugin, 'metadata');
    this.assetCategoryService = assetCategoryService;

    /* eslint-disable sort-keys */
    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ path: 'device-manager/:engineId/metadata', verb: 'post' }],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [{ path: 'device-manager/:engineId/metadata/:_id', verb: 'delete' }],
        },
        get: {
          handler: this.get.bind(this),
          http: [{ path: 'device-manager/:engineId/metadata/:_id', verb: 'get' }],
        },
        update: {
          handler: this.update.bind(this),
          http: [{ path: 'device-manager/:engineId/metadata/:_id', verb: 'put' }],
        }
      },
    };
  }

  async create (request: KuzzleRequest) {
    request.input.args._id = request.input.body.name;
    const mandatory = request.input.body.mandatory;
    const objectValueList: JSONObject[] = request.input.body.objectValueList;
    if (! mandatory) {
      request.input.body.mandatory = false;
    }
    if (objectValueList) {
      const formattedMetadataValuesList = [];
      for (const objectValue of objectValueList) {
        const formattedMetadataValues = await this.assetCategoryService.formatMetadataForES(objectValue);
        formattedMetadataValuesList.push({ object: formattedMetadataValues });
      }
      request.input.body.objectValueList = formattedMetadataValuesList;
    }
    return super.create(request);
  }

  async update (request: KuzzleRequest) {
    return super.genericUpdate(request, ['AssetCategory']);
  }

  async delete (request: KuzzleRequest) {
    const AssetCategory = this.getFieldPath(request, 'assetMetadata', null, 'asset-category');
    return super.genericDelete(request, [], [], [AssetCategory]);
  }


  async get (request: KuzzleRequest) {
    const id = request.getId();
    const engineId = request.getString('engineId');
    const metadata = await this.sdk.document.get<MetadataContent>(engineId, this.collection, id);
    const processedMetadata = JSON.parse(JSON.stringify(metadata._source)) as ProcessedMetadataContent;

    if (metadata._source.objectValueList) {
      processedMetadata.objectValueList = [];
      for (const objectValue of metadata._source.objectValueList) {
        processedMetadata.objectValueList.push(this.assetCategoryService.formatMetadataForGet(objectValue.object));
      }
    }
    return processedMetadata;
  }
}
