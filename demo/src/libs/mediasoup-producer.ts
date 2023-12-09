import { Device } from "mediasoup-client";
import { Transport } from "mediasoup-client/lib/Transport";
import { MediasoupEventEmitter } from './mediasoup-events';

export const ProducerEvent = {
  KEY_PRODUCER_CONNECT: 'producer-connect',
  KEY_PRODUCER_PRODUCE: 'producer-produce',
}

export class MediasoupProducer extends MediasoupEventEmitter {
  private device?:Device;
  private rtpCapabilities:object;
  private transport?:Transport;
  private producer:any;

  constructor(rtpCapabilities: object) {
    super();
    this.rtpCapabilities = rtpCapabilities;
  }

  async create(sendTransport:any) : Promise<void> {
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: this.rtpCapabilities });

    this.transport = await this.device.createSendTransport(sendTransport);
    this.transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      if (!this.transport) {
        errback(new Error('transport is not initialized.'));
        return;
      }

      try {
        this.emit(ProducerEvent.KEY_PRODUCER_CONNECT, {
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

    this.transport.on('produce', async (parameters, callback, errback) => {
      if (!this.transport) {
        errback(new Error('transport is not initialized.'));
        return;
      }

      try {
        this.emit(ProducerEvent.KEY_PRODUCER_PRODUCE, {
          'type': 'produce', 
          'payload': {
            'id': this.transport.id,
            'parameters': parameters
          }
        });
        callback({ id: this.transport.id });
      } catch (e) {
        errback(new Error('error'));
      }
    });
  }

  async produce(stream: MediaStream) : Promise<void> {
    if (!this.transport) {
      throw 'transport is not initialized.';
    }

    try {
      // 音声を流す場合
      // const track = stream.getAudioTracks()[0];
      // this.producer = await this.transport!.produce({ track });

      const track = stream.getVideoTracks()[0];
      this.producer = await this.transport.produce({ track });

      // simulcast を使用する場合
      // this.producer = await this.transport!.produce({
      //   track: track,
      //   encodings: [
      //     { maxBitrate: 900000, scaleResolutionDownBy: 1 },
      //     { maxBitrate: 300000, scaleResolutionDownBy: 2 },
      //     { maxBitrate: 100000, scaleResolutionDownBy: 4 },
      //   ],
      //   codecOptions: {
      //     videoGoogleStartBitrate : 1000
      //   }
      // });
    } catch(e) {
      console.log('Failed to create produce.', e);
    }
  }

  isPaused() : boolean {
    return this.producer?.paused;
  }

  pause() : void {
    this.producer?.pause();
  }

  resume() : void {
    this.producer?.resume();
  }

  close() : void {
    this.producer?.close();
    this.producer = undefined;
    this.transport?.close();
    this.transport = undefined;
  }
}
