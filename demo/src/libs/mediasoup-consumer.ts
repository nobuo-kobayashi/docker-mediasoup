import { Device } from "mediasoup-client";
import { Transport } from "mediasoup-client/lib/Transport";
import { MediasoupEventEmitter } from './mediasoup-events';

const ConsumerType = {
  Audio: 'audio',
  Video: 'video'
}

export const ConsumerEvent = {
  KEY_CONSUMER_CONNECTED: 'consumer-connected',
  KEY_CONSUMER_CONSUME: 'consumer-consume'
}

export class MediasoupConsumer extends MediasoupEventEmitter {
  private device?:Device;
  private rtpCapabilities:object;
  private transport?:Transport;
  private transportId?:string;
  private producerId?:string;
  private consumer = new Map();

  constructor(rtpCapabilities:object) {
    super();
    this.rtpCapabilities = rtpCapabilities;
  }

  getTransportId() {
    return this.transportId;
  }

  async create(recvTransport:any, producerId:string) : Promise<void> {
    this.transportId = recvTransport.id;
    this.producerId = producerId;
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: this.rtpCapabilities });

    this.transport = this.device.createRecvTransport(recvTransport);
    this.transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      if (!this.transport) {
        errback(new Error('transport is not initialized.'));
        return;
      }

      try {
        this.emit(ConsumerEvent.KEY_CONSUMER_CONNECTED, {
          type: 'connect',
          payload: {
            id: this.transport.id, 
            dtlsParameters: dtlsParameters
          }
        });
        callback();
      } catch (e) {
        errback(new Error('error'));
      }
    });

    this.emit(ConsumerEvent.KEY_CONSUMER_CONSUME, {
      type: 'consume', 
      payload: {
        id: this.transport.id,
        producerId: this.producerId,
        rtpCapabilities: this.device.rtpCapabilities
      }
    });
  }

  async consume(consumerOptions:any) : Promise<void> {
    if (!this.transport) {
      throw new Error('transport is not initialized.');
    }

    const consumer = await this.transport.consume({
      id: consumerOptions.id,
      producerId: this.producerId,
      kind: consumerOptions.kind,
      rtpParameters: consumerOptions.rtpParameters
    });

    if (consumerOptions.kind === 'video') {
      this.consumer.set(ConsumerType.Video, consumer);
    } else if (consumerOptions.kind === 'audio') {
      this.consumer.set(ConsumerType.Audio, consumer);
    } else {
      consumer.close();
      throw new Error(`Unknwon consumer type. type=${consumerOptions.kind}`);
    }
  }

  play(remoteVideo:HTMLVideoElement) {
    if (this.consumer.size === 0) {
      return;
    }

    const tracks = [];
    for (const consumer of this.consumer.values()) {
      tracks.push(consumer.track);
    }
    remoteVideo.srcObject = new MediaStream(tracks);
  }

  close() : void {
    for (const consumer of this.consumer.values()) {
      consumer.close();
    }
    this.consumer.clear();
    this.transport?.close();
    this.transport = undefined;
  }
}
