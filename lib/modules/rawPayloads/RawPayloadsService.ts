import { KDocument } from "kuzzle-sdk";

import { DeviceManagerPlugin } from "../plugin";
import { BaseService } from "../shared";

import { RawPayloadsContent } from "./types/RawPayloadsContent";

export class RawPayloadsService extends BaseService {
  constructor(plugin: DeviceManagerPlugin) {
    super(plugin);
  }

  async get(payloadUuid: string): Promise<KDocument<RawPayloadsContent>> {
    const payload = await this.sdk.document.get<RawPayloadsContent>(
      this.config.adminIndex,
      "payloads",
      payloadUuid,
    );

    return payload;
  }
}
