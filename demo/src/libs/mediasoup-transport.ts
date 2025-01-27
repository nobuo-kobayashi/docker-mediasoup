import { Device } from "mediasoup-client";
import { Transport } from "mediasoup-client/lib/Transport";
import { MediasoupEventEmitter } from './mediasoup-events';

export const ProducerEvent = {
  KEY_PRODUCER_CONNECT: 'producer-connect',
  KEY_PRODUCER_PRODUCE: 'producer-produce',
}

export class MediasoupTransport extends MediasoupEventEmitter {
  protected device?:Device;
  protected rtpCapabilities:object;
  protected transport?:Transport;

  constructor(rtpCapabilities: object) {
    super();
    this.rtpCapabilities = rtpCapabilities;
  }

  getTransportId() {
    return this.transport?.id;
  }

  async createDevice() : Promise<Device> {
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: this.rtpCapabilities });
    return this.device;
  }

  close() : void {
    this.transport?.close();
    this.transport = undefined;
  }
}
