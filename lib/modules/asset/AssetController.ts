import { BadRequestError, ControllerDefinition, KuzzleRequest } from "kuzzle";

import { AssetService } from "./AssetService";
import { AssetSerializer } from "./model/AssetSerializer";

export class AssetController {
  public definition: ControllerDefinition;

  private assetService: AssetService;

  constructor(assetService: AssetService) {
    this.assetService = assetService;

    /* eslint-disable sort-keys */
    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [{ path: "device-manager/:engineId/assets", verb: "post" }],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [
            { path: "device-manager/:engineId/assets/:_id", verb: "delete" },
          ],
        },
        get: {
          handler: this.get.bind(this),
          http: [{ path: "device-manager/:engineId/assets/:_id", verb: "get" }],
        },
        search: {
          handler: this.search.bind(this),
          http: [
            { path: "device-manager/:engineId/assets/_search", verb: "post" },
            { path: "device-manager/:engineId/assets/_search", verb: "get" },
          ],
        },
        update: {
          handler: this.update.bind(this),
          http: [{ path: "device-manager/:engineId/assets/:_id", verb: "put" }],
        },

        getMeasures: {
          handler: this.getMeasures.bind(this),
          http: [
            {
              path: "device-manager/:engineId/assets/:_id/measures",
              verb: "get",
            },
          ],
        },
      },
    };
    /* eslint-enable sort-keys */
  }

  async get(request: KuzzleRequest) {
    const assetId = request.getId();
    const engineId = request.getString("engineId");

    const asset = await this.assetService.get(engineId, assetId);

    return {
      asset: AssetSerializer.serialize(asset),
    };
  }

  async update(request: KuzzleRequest) {
    const assetId = request.getId();
    const engineId = request.getString("engineId");
    const metadata = request.getBody();
    const refresh = request.getRefresh();

    const updatedAsset = await this.assetService.update(
      engineId,
      assetId,
      metadata,
      {
        refresh,
      }
    );

    return {
      asset: AssetSerializer.serialize(updatedAsset),
    };
  }

  async create(request: KuzzleRequest) {
    const engineId = request.getString("engineId");
    const model = request.getBodyString("model");
    const reference = request.getBodyString("reference");
    const metadata = request.getBodyObject("metadata", {});
    const refresh = request.getRefresh();

    const asset = await this.assetService.create(
      engineId,
      model,
      reference,
      metadata,
      {
        refresh,
      }
    );

    return {
      asset: AssetSerializer.serialize(asset),
    };
  }

  async delete(request: KuzzleRequest) {
    const engineId = request.getString("engineId");
    const assetId = request.getId();
    const refresh = request.getRefresh();
    const strict = request.getBoolean("strict");

    await this.assetService.delete(engineId, assetId, {
      refresh,
      strict,
    });
  }

  async search(request: KuzzleRequest) {
    const engineId = request.getString("engineId");
    const {
      searchBody,
      from,
      size,
      scrollTTL: scroll,
    } = request.getSearchParams();
    const lang = request.getLangParam();

    const result = await this.assetService.search(engineId, searchBody, {
      from,
      lang,
      scroll,
      size,
    });

    return result;
  }

  async getMeasures(request: KuzzleRequest) {
    const id = request.getId();
    const engineId = request.getString("engineId");
    const size = request.input.args.size;
    const startAt = request.input.args.startAt
      ? request.getDate("startAt")
      : null;
    const endAt = request.input.args.endAt ? request.getDate("endAt") : null;

    if ((size && startAt) || (size && endAt)) {
      throw new BadRequestError(
        'You cannot specify both a "size" and a "startAt" or "endAt"'
      );
    }

    const measures = await this.assetService.measureHistory(engineId, id, {
      endAt,
      size,
      startAt,
    });

    return { measures };
  }
}
