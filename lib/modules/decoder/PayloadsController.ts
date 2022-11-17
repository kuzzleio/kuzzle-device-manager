import { ControllerDefinition, KuzzleRequest } from "kuzzle";

import { DecodersRegister } from "../../core/registers/DecodersRegister";

import { PayloadService } from "./PayloadService";
import { ApiPayloadReceiveUnkownResult } from "./types/PayloadApi";

export class PayloadsController {
  private payloadService: PayloadService;
  private decodersRegister: DecodersRegister;

  public definition: ControllerDefinition;

  constructor(
    payloadService: PayloadService,
    decodersRegister: DecodersRegister
  ) {
    this.payloadService = payloadService;
    this.decodersRegister = decodersRegister;

    this.definition = {
      actions: {
        receiveUnknown: {
          handler: this.receiveUnknown.bind(this),
          http: [
              {
                openapi: {
                  description: `Receive a payload from a device`,
                  parameters: [
                    {
                      in: "path",
                      name: "deviceModel",
                      required: true,
                      schema: {
                        type: "string",
                      },
                    },
                    {
                      in: "body",
                      name: "payload",
                      required: true,
                      schema: {
                        type: "object",
                      },
                    },
                  ],
                },
              path: "device-manager/payload/:deviceModel",
              verb: "post"
            },
          ],
        },
      },
    };

    for (const decoder of this.decodersRegister.decoders) {
      this.definition.actions[decoder.action] = {
        handler: (request: KuzzleRequest) =>
          this.payloadService.receive(request, decoder),
        http: decoder.http,
      };
    }
  }

  async receiveUnknown (request: KuzzleRequest): Promise<ApiPayloadReceiveUnkownResult> {
    const payload = request.getBody();
    const deviceModel = request.getString("deviceModel");

    await this.payloadService.receiveUnknown(deviceModel, payload);
  }
}
