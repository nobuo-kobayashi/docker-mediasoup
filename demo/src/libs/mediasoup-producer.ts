import { Device } from "mediasoup-client";
import { Transport, TransportOptions } from "mediasoup-client/lib/Transport";
import { RtpCapabilities } from 'mediasoup-client/lib/types'
import { MediasoupEventEmitter } from './mediasoup-events';
import { MediasoupProducerParams } from "./mediasoup-types";

const ProducerType = {
  Audio: 'audio',
  Video: 'video'
}

export const ProducerEvent = {
  KEY_PRODUCER_CONNECT: 'producer-connect',
  KEY_PRODUCER_PRODUCE: 'producer-produce',
  KEY_DATA_PRODUCER_PRODUCE: 'producer-data-produce'
}

export class MediasoupProducer extends MediasoupEventEmitter {
  private device?:Device;
  private rtpCapabilities:RtpCapabilities;
  private transport?:Transport;
  private producer = new Map();
  private dataProducer:any;
  private paused = false;
  private params:MediasoupProducerParams;

  constructor(rtpCapabilities: RtpCapabilities, params:MediasoupProducerParams) {
    super();
    this.rtpCapabilities = rtpCapabilities;
    this.params = params;
  }

  getName() {
    return this.params.name;
  }

  getTransportId() {
    return this.transport?.id;
  }

  async create(sendTransport:TransportOptions) : Promise<void> {
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

      if (this.params.name) {
        parameters['appData'] = {
          id: this.params.id,
          name: this.params.name
        }
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

    this.transport.on('producedata', async (parameters, callback, errback) => {
      if (!this.transport) {
        errback(new Error('transport is not initialized.'));
        return;
      }

      if (this.params.name) {
        parameters['appData'] = {
          id: this.params.id,
          name: this.params.name
        }
      }

      try {
        this.emit(ProducerEvent.KEY_DATA_PRODUCER_PRODUCE, {
          type: 'dataProduce',
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

  async dataProduce() : Promise<void> {
    if (!this.transport) {
      throw new Error('transport is not initialized.');
    }

    this.dataProducer = await this.transport.produceData();
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

  send(message:string) : void {
    this.dataProducer?.send(message);
  }

  close() : void {
    this.dataProducer?.close();
    this.dataProducer = undefined;
    for (const producer of this.producer.values()) {
      producer.close();
    }
    this.producer.clear();
    this.transport?.close();
    this.transport = undefined;
    this.paused = true;
  }
}
