import { ControllerDefinition, KuzzleRequest } from "kuzzle";

import { RawPayloadsService } from "./RawPayloadsService";
import { ApiRawPayloadsGetResult } from "./types/RawPayloadsApi";

export class RawPayloadsController {
  private rawPayloadsService: RawPayloadsService;

  public definition: ControllerDefinition;

  constructor(rawPayloadsService: RawPayloadsService) {
    this.rawPayloadsService = rawPayloadsService;

    this.definition = {
      actions: {
        get: {
          handler: this.get.bind(this),
          http: [{ path: "device-manager/raw-payloads/:_id", verb: "get" }],
        },
      },
    };
  }

  async get(request: KuzzleRequest): Promise<ApiRawPayloadsGetResult> {
    const payloadUuid = request.getId();

    return this.rawPayloadsService.get(payloadUuid);
  }
}
