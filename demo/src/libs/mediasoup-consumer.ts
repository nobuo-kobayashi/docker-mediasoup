import { Device } from "mediasoup-client";
import { Transport } from "mediasoup-client/lib/Transport";
import { MediasoupEventEmitter } from './mediasoup-events';

export const ConsumerEvent = {
  KEY_CONSUMER_CONNECTED: 'consumer-connected',
  KEY_CONSUMER_CONSUME: 'consumer-consume'
}

export class MediasoupConsumer extends MediasoupEventEmitter {
  private device?:Device;
  private rtpCapabilities:object;
  private transport?:Transport;
  private producerId?:string;
  private consumer:any;

  constructor(rtpCapabilities:object) {
    super();
    this.rtpCapabilities = rtpCapabilities;
  }

  async create(recvTransport:any, producerId:string) : Promise<void> {
    this.producerId = producerId;
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: this.rtpCapabilities });

    this.transport = await this.device.createRecvTransport(recvTransport);
    this.transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      if (!this.transport) {
        errback(new Error('transport is not initialized.'));
        return;
      }

      try {
        this.emit(ConsumerEvent.KEY_CONSUMER_CONNECTED, {
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

    this.emit(ConsumerEvent.KEY_CONSUMER_CONSUME, {
      'type': 'consume', 
      'payload': {
        'id': this.transport.id,
        'producerId': this.producerId,
        'rtpCapabilities': this.device.rtpCapabilities
      }
    });
  }

  async consume(consumerOptions:any, remoteVideo:HTMLVideoElement) : Promise<void> {
    if (!this.transport) {
      throw 'transport is not initialized.';
    }

    this.consumer = await this.transport.consume({
      'id': consumerOptions.id,
      'producerId': this.producerId,
      'kind': consumerOptions.kind,
      'rtpParameters': consumerOptions.rtpParameters
    });
    remoteVideo.srcObject = new MediaStream([ this.consumer.track ]);
  }

  close() : void {
    this.consumer?.close();
    this.consumer = undefined;
    this.transport?.close();
    this.transport = undefined;
  }
}
