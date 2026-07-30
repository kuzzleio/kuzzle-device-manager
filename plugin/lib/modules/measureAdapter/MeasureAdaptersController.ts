import { ControllerDefinition, KuzzleRequest, NameGenerator } from "kuzzle";
import { KuzzleLogger } from "kuzzle-logger";

import { MeasureAdapterService } from "./MeasureAdapterService";
import {
  ApiMeasureAdapterCreateResult,
  ApiMeasureAdapterDeleteResult,
  ApiMeasureAdapterGetResult,
  ApiMeasureAdapterSearchResult,
  ApiMeasureAdapterUpdateResult,
  MeasureAdapterMapping,
} from "./exports";

export class MeasureAdaptersController {
  public definition: ControllerDefinition;
  readonly logger: KuzzleLogger;

  constructor(
    private measureAdapterService: MeasureAdapterService,
    logger: KuzzleLogger,
  ) {
    this.logger = logger;
    /* eslint-disable sort-keys */
    this.definition = {
      actions: {
        create: {
          handler: this.create.bind(this),
          http: [
            {
              path: "device-manager/:engineId/measureAdapters",
              verb: "post",
            },
          ],
        },
        get: {
          handler: this.get.bind(this),
          http: [
            {
              path: "device-manager/:engineId/measureAdapters/:_id",
              verb: "get",
            },
          ],
        },
        update: {
          handler: this.update.bind(this),
          http: [
            {
              path: "device-manager/:engineId/measureAdapters/:_id",
              verb: "put",
            },
          ],
        },
        delete: {
          handler: this.delete.bind(this),
          http: [
            {
              path: "device-manager/:engineId/measureAdapters/:_id",
              verb: "delete",
            },
          ],
        },
        search: {
          handler: this.search.bind(this),
          http: [
            {
              path: "device-manager/:engineId/measureAdapters/_search",
              verb: "get",
            },
            {
              path: "device-manager/:engineId/measureAdapters/_search",
              verb: "post",
            },
          ],
        },
      },
    };
    /* eslint-enable sort-keys */
  }

  async create(request: KuzzleRequest): Promise<ApiMeasureAdapterCreateResult> {
    const engineId = request.getString("engineId");
    const name = request.getBodyString("name");
    const source = request.getBodyString("source");
    const mapping = request.getBodyArray("mapping") as MeasureAdapterMapping[];

    const _id = request.getId({
      generator: () =>
        NameGenerator.generateRandomName({ prefix: "measure-adapter" }),
      ifMissing: "generate",
    });

    return this.measureAdapterService.create(
      _id,
      engineId,
      name,
      source,
      mapping,
      request,
    );
  }

  async get(request: KuzzleRequest): Promise<ApiMeasureAdapterGetResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();

    return this.measureAdapterService.get(engineId, _id, request);
  }

  async update(request: KuzzleRequest): Promise<ApiMeasureAdapterUpdateResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();
    const body = request.getBody() as {
      name?: string;
      source?: string;
      mapping?: MeasureAdapterMapping[];
    };
    const { name, source, mapping } = body;

    return this.measureAdapterService.update(
      _id,
      engineId,
      name,
      source,
      mapping,
      request,
    );
  }

  async delete(request: KuzzleRequest): Promise<ApiMeasureAdapterDeleteResult> {
    const engineId = request.getString("engineId");
    const _id = request.getId();

    await this.measureAdapterService.delete(_id, engineId, request);
  }

  async search(request: KuzzleRequest): Promise<ApiMeasureAdapterSearchResult> {
    const engineId = request.getString("engineId");
    const searchParams = request.getSearchParams();

    return this.measureAdapterService.search(engineId, searchParams, request);
  }
}
