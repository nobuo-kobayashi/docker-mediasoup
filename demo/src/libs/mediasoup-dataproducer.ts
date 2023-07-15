import { Device } from "mediasoup-client";
import { Transport } from "mediasoup-client/lib/Transport";

export interface MediasoupDataProducerListener {
  onDataProducerConnected(message: any) : void;
  onDataProducerProduce(message: any) : void;
}

export class MediasoupDataProducer {
  private device: Device | undefined;
  private rtpCapabilities: object;
  private transport: Transport | undefined;
  private listener: MediasoupDataProducerListener | undefined;
  private dataProducer: any;

  constructor(rtpCapabilities: object) {
    this.rtpCapabilities = rtpCapabilities;
  }

  setListener(listener: MediasoupDataProducerListener) : void {
    this.listener = listener;
  }

  async create(sendTransport: any) : Promise<void> {
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: this.rtpCapabilities });

    this.transport = await this.device.createSendTransport(sendTransport);
    this.transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        const id:string = this.transport!.id;
        this.listener!.onDataProducerConnected({
          'type': 'connect', 
          'payload': {
            'id': id,
            'dtlsParameters': dtlsParameters
          }
        });
        callback();
      } catch (e) {
        errback(new Error());
      }
    });

    this.transport.on('producedata', async (parameters, callback, errback) => {
      try {
        const id:string = this.transport!.id;
        this.listener!.onDataProducerProduce({
          'type': 'dataProduce',
          'payload': {
            'id': id,
            'parameters': parameters
          }
        });
        callback({ id });
      } catch (e) {
        errback(new Error());
      }
    });
  }

  async dataProduce() : Promise<void> {
    try {
      this.dataProducer = await this.transport!.produceData();
    } catch(e) {
      console.log('Failed to create produce.', e);
    }
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
