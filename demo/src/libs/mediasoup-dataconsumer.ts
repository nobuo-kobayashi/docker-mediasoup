import { Device } from "mediasoup-client";
import { Transport } from "mediasoup-client/lib/Transport";

export interface MediasoupDataConsumerListener {
  onDataConsumerConnected(message: any) : void;
  onDataConsumerConsume(message: any) : void;
  onDataConsumerMessage(message: string) : void;
}

export class MediasoupDataConsumer {
  private device: Device | undefined;
  private rtpCapabilities: object;
  private transport: Transport | undefined;
  private listener: MediasoupDataConsumerListener | undefined;
  private dataProducerId: string | undefined;
  private dataConsumer: any;

  constructor (rtpCapabilities: object) {
    this.rtpCapabilities = rtpCapabilities;
  }

  setListener(listener: MediasoupDataConsumerListener) : void {
    this.listener = listener;
  }

  async create(recvTransport: any, dataProducerId: string) : Promise<void> {
    this.dataProducerId = dataProducerId;
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: this.rtpCapabilities });

    this.transport = await this.device.createRecvTransport(recvTransport);
    this.transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        this.listener!.onDataConsumerConnected({
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

    this.listener!.onDataConsumerConsume({
      'type': 'dataConsume', 
      'payload': {
        'id': this.transport!.id,
        'dataProducerId': this.dataProducerId
      }
    });
  }

  async dataConsume(consumerOptions:any) : Promise<void> {
    this.dataConsumer = await this.transport!.consumeData({
      'id': consumerOptions.id,
      'dataProducerId': this.dataProducerId!,
      'sctpStreamParameters': consumerOptions.sctpStreamParameters,
      'label': consumerOptions.label,
      'protocol': consumerOptions.protocol,
    });
    this.dataConsumer.on('message', (msg:string) => {
      this.listener!.onDataConsumerMessage(msg);
    });
  }

  close() : void {
    this.dataConsumer?.close();
    this.dataConsumer = undefined;
    this.transport?.close();
    this.transport = undefined;
  }
}
