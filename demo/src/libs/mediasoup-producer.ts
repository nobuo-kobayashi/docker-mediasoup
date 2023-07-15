import { Device } from "mediasoup-client";
import { Transport } from "mediasoup-client/lib/Transport";

export interface MediasoupProducerListener {
  onProducerConnected(message: any) : void;
  onProducerProduce(message: any) : void;
}

export class MediasoupProducer {
  private device: Device | undefined;
  private rtpCapabilities: object;
  private transport: Transport | undefined;
  private listener: MediasoupProducerListener | undefined;
  private producer: any;

  constructor(rtpCapabilities: object) {
    this.rtpCapabilities = rtpCapabilities;
  }

  setListener(listener: MediasoupProducerListener) : void {
    this.listener = listener;
  }

  async create(sendTransport: any) : Promise<void> {
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: this.rtpCapabilities });

    this.transport = await this.device.createSendTransport(sendTransport);
    this.transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        const id:string = this.transport!.id;
        this.listener!.onProducerConnected({
          'type': 'connect', 
          'payload': {
            'id': id,
            'dtlsParameters': dtlsParameters
          }
        });
        callback();
      } catch (e) {
        errback(new Error('error'));
      }
    });

    this.transport.on('produce', async (parameters, callback, errback) => {
      try {
        const id:string = this.transport!.id;
        this.listener!.onProducerProduce({
          'type': 'produce', 
          'payload': {
            'id': id,
            'parameters': parameters
          }
        });
        callback({ id });
      } catch (e) {
        errback(new Error('error'));
      }
    });
  }

  async produce(stream: MediaStream) : Promise<void> {
    try {
      // 音声を流す場合
      // const track = stream.getAudioTracks()[0];
      // this.producer = await this.transport!.produce({ track });

      const track = stream.getVideoTracks()[0];
      this.producer = await this.transport!.produce({ track });

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
