import { Decoder, DeviceContent, Device, BaseAsset } from '../../../../index';
import { JSONObject, KuzzleRequest, PreconditionError } from 'kuzzle';

export class DummyTempDecoder extends Decoder {
  constructor () {
    super('DummyTemp');

    this.payloadsMappings = {
      deviceEUI: { type: 'keyword' }
    };
  }

  async validate (payload: JSONObject, request: KuzzleRequest) {
    if (! payload.deviceEUI) {
      throw new PreconditionError('Invalid payload: missing "deviceEUI"');
    }

    if (payload.invalid) {
      return false;
    }

    return true;
  }

  async decode (payload: JSONObject, request: KuzzleRequest): Promise<DeviceContent> {
    const deviceContent: DeviceContent = {
      reference: payload.deviceEUI,
      measures: {
        temperature: {
          updatedAt: Date.now(),
          degree: payload.register55,
        }
      },
      qos: {
        battery: payload.batteryLevel * 100,
        historize: payload.historize,
      }
    };

    return deviceContent;
  }

  async beforeRegister (device: Device, request: KuzzleRequest) {
    device._source.qos.registerEnriched = true;

    return device;
  }

  async beforeUpdate (device: Device, request: KuzzleRequest) {
    device._source.qos.updateEnriched = true;

    return device;
  }

  async afterRegister (device: Device, request: KuzzleRequest) {
    const result = await super.afterRegister(device, request);

    return {
      ...result,
      afterRegister: true,
    };
  }

  async afterUpdate (device: Device, asset: BaseAsset, request: KuzzleRequest) {
    const result = await super.afterUpdate(device, asset, request);

    return {
      ...result,
      afterUpdate: true
    };
  }
}
