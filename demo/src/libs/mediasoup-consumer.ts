import { Device } from "mediasoup-client";
import { Transport } from "mediasoup-client/lib/Transport";

export interface MediasoupConsumerListener {
  onConsumerConnected(message:any) : void;
  onConsumerConsume(message:any) : void;
}

export class MediasoupConsumer {
  private device: Device | undefined;
  private rtpCapabilities: object;
  private transport: Transport | undefined;
  private listener: MediasoupConsumerListener | undefined;
  private producerId: string | undefined;
  private consumer:any;

  constructor(rtpCapabilities:object) {
    this.rtpCapabilities = rtpCapabilities;
  }

  setListener(listener:MediasoupConsumerListener) : void {
    this.listener = listener;
  }

  async create(recvTransport:any, producerId:string) : Promise<void> {
    this.producerId = producerId;
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: this.rtpCapabilities });

    this.transport = await this.device.createRecvTransport(recvTransport);
    this.transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        this.listener!.onConsumerConnected({
          'type': 'connect',
          'payload': {
            'id': this.transport!.id, 
            'dtlsParameters': dtlsParameters
          }
        });
        callback();
      } catch (e) {
        errback(new Error('error'));
      }
    });

    this.listener!.onConsumerConsume({
      'type': 'consume', 
      'payload': {
        'id': this.transport!.id,
        'producerId': this.producerId,
        'rtpCapabilities': this.device.rtpCapabilities
      }
    });
  }

  async consume(consumerOptions:any, remoteVideo:HTMLVideoElement) : Promise<void> {
    this.consumer = await this.transport!.consume({
      'id': consumerOptions.id,
      'producerId': this.producerId,
      'kind': consumerOptions.kind,
      'rtpParameters': consumerOptions.rtpParameters
    });
    remoteVideo.srcObject = new MediaStream([ this.consumer!.track ]);
  }

  close() : void {
    this.consumer?.close();
    this.consumer = undefined;
    this.transport?.close();
    this.transport = undefined;
  }
}
