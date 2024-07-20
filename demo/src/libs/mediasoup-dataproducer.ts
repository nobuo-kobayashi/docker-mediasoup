import { Device } from "mediasoup-client";
import { Transport } from "mediasoup-client/lib/Transport";
import { MediasoupEventEmitter } from './mediasoup-events';

export const DataProducerEvent = {
  KEY_DATA_PRODUCER_CONNECTED: 'dataProducer-connected',
  KEY_DATA_PRODUCER_PRODUCE: 'dataProducer-produce',
}

export class MediasoupDataProducer extends MediasoupEventEmitter {
  private device?:Device;
  private rtpCapabilities:object;
  private transportId?:string;
  private transport?:Transport;
  private dataProducer:any;

  constructor(rtpCapabilities:object) {
    super();
    this.rtpCapabilities = rtpCapabilities;
  }

  getTransportId() {
    return this.transportId;
  }

  async create(sendTransport:any) : Promise<void> {
    this.transportId = sendTransport.id;
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: this.rtpCapabilities });

    this.transport = this.device.createSendTransport(sendTransport);
    this.transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      if (!this.transport) {
        errback(new Error('transport is not initialized.'));
        return;
      }

      try {
        this.emit(DataProducerEvent.KEY_DATA_PRODUCER_CONNECTED, {
          type: 'connect', 
          payload: {
            id: this.transport.id,
            dtlsParameters: dtlsParameters
          }
        });
        callback();
      } catch (e) {
        errback(new Error());
      }
    });

    this.transport.on('producedata', async (parameters, callback, errback) => {
      if (!this.transport) {
        errback(new Error('transport is not initialized.'));
        return;
      }

      try {
        this.emit(DataProducerEvent.KEY_DATA_PRODUCER_PRODUCE, {
          type: 'dataProduce',
          payload: {
            id: this.transport.id,
            parameters: parameters
          }
        });
        callback({ id: this.transport.id });
      } catch (e) {
        errback(new Error());
      }
    });
  }

  async dataProduce() : Promise<void> {
    if (!this.transport) {
      throw new Error('transport is not initialized.');
    }

    this.dataProducer = await this.transport.produceData();
  }

  send(message:string) : void {
    this.dataProducer?.send(message);
  }

  close() : void {
    this.dataProducer?.close();
    this.dataProducer = undefined;
    this.transport?.close();
    this.transport = undefined;
  }
}
