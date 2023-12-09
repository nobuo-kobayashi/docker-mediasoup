import { Device } from "mediasoup-client";
import { Transport } from "mediasoup-client/lib/Transport";
import { MediasoupEventEmitter } from './mediasoup-events';

export const DataConsumerEvent = {
  KEY_DATA_CONSUMER_CONNECTED: 'dataConsumer-connected',
  KEY_DATA_CONSUMER_CONSUME: 'dataConsumer-consume',
  KEY_DATA_CONSUMER_MESSAGE: 'dataConsumer-message',
}

export class MediasoupDataConsumer extends MediasoupEventEmitter {
  private device?:Device;
  private rtpCapabilities:object;
  private transport?:Transport;
  private dataProducerId?:string;
  private dataConsumer:any;

  constructor(rtpCapabilities:object) {
    super();
    this.rtpCapabilities = rtpCapabilities;
  }

  async create(recvTransport:any, dataProducerId:string) : Promise<void> {
    this.dataProducerId = dataProducerId;
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: this.rtpCapabilities });

    this.transport = await this.device.createRecvTransport(recvTransport);
    this.transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      if (!this.transport) {
        errback(new Error('transport is not initialized.'));
        return;
      }

      try {
        this.emit(DataConsumerEvent.KEY_DATA_CONSUMER_CONNECTED, {
          'type': 'connect',
          'payload': {
            'id': this.transport.id, 
            'dtlsParameters': dtlsParameters
          }
        });
        callback();
      } catch (e) {
        errback(new Error('error'));
      }
    });

    this.emit(DataConsumerEvent.KEY_DATA_CONSUMER_CONSUME, {
      'type': 'dataConsume', 
      'payload': {
        'id': this.transport.id,
        'dataProducerId': this.dataProducerId
      }
    });
  }

  async dataConsume(consumerOptions:any) : Promise<void> {
    if (!this.transport) {
      throw 'transport is not initialized.';
    }
    if (!this.dataProducerId) {
      throw 'dataProducerId is not initialized.';
    }

    this.dataConsumer = await this.transport.consumeData({
      'id': consumerOptions.id,
      'dataProducerId': this.dataProducerId,
      'sctpStreamParameters': consumerOptions.sctpStreamParameters,
      'label': consumerOptions.label,
      'protocol': consumerOptions.protocol,
    });
    this.dataConsumer.on('message', (msg:string) => {
      this.emit(DataConsumerEvent.KEY_DATA_CONSUMER_MESSAGE, msg);
    });
  }

  close() : void {
    this.dataConsumer?.close();
    this.dataConsumer = undefined;
    this.transport?.close();
    this.transport = undefined;
  }
}
