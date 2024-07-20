import { Device } from "mediasoup-client";
import { Transport } from "mediasoup-client/lib/Transport";
import { MediasoupEventEmitter } from './mediasoup-events';

const ProducerType = {
  Audio: 'audio',
  Video: 'video'
}

export const ProducerEvent = {
  KEY_PRODUCER_CONNECT: 'producer-connect',
  KEY_PRODUCER_PRODUCE: 'producer-produce',
}

export class MediasoupProducer extends MediasoupEventEmitter {
  private device?:Device;
  private rtpCapabilities:object;
  private transport?:Transport;
  private transportId?:string;
  private producer = new Map();
  private paused = false;

  constructor(rtpCapabilities: object) {
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
        this.emit(ProducerEvent.KEY_PRODUCER_CONNECT, {
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

    this.transport.on('produce', async (parameters, callback, errback) => {
      if (!this.transport) {
        errback(new Error('transport is not initialized.'));
        return;
      }

      try {
        this.emit(ProducerEvent.KEY_PRODUCER_PRODUCE, {
          type: 'produce', 
          payload: {
            id: this.transport.id,
            parameters: parameters
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
      throw new Error('transport is not initialized.');
    }

    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    // 映像を流す場合
    if (videoTracks && videoTracks.length > 0) {
      const track = stream.getVideoTracks()[0];
      const producer = await this.transport.produce({ track });
      this.producer.set(ProducerType.Video, producer);

      // simulcast を使用する場合
      // this.producer = await this.transport.produce({
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
    }

    // 音声を流す場合
    if (audioTracks && audioTracks.length > 0) {
      const track = stream.getAudioTracks()[0];
      const producer = await this.transport.produce({ track });
      this.producer.set(ProducerType.Audio, producer);
    }
  }

  isPaused() : boolean {
    return this.paused;
  }

  pause() : void {
    for (const producer of this.producer.values()) {
      producer.pause();
    }
    this.paused = true;
  }

  resume() : void {
    for (const producer of this.producer.values()) {
      producer.resume();
    }
    this.paused = false;
  }

  close() : void {
    for (const producer of this.producer.values()) {
      producer.close();
    }
    this.producer.clear();
    this.transport?.close();
    this.transport = undefined;
    this.paused = true;
  }
}
