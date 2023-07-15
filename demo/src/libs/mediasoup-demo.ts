import { WebsocketClient, WebsocketClientListener } from "./websocket-client";
import { MediasoupProducer, MediasoupProducerListener } from "./mediasoup-producer";
import { MediasoupConsumer, MediasoupConsumerListener } from "./mediasoup-consumer";
import { MediasoupDataProducer, MediasoupDataProducerListener } from "./mediasoup-dataproducer";
import { MediasoupDataConsumer, MediasoupDataConsumerListener } from "./mediasoup-dataconsumer";

export interface MediasoupDemoListener {
  onWSOpen() : void;
  onWSClose() : void;
  onProducerId(producerId:string) : void;
  onDataProducerId(dataProducerId:string) : void;
  onDataChannelMessage(message:string) : void;
  onProducerList(producerList:any) : void;
  onDataProducerList(dataProducerList:any) : void;
}

export class MediasoupDemo implements WebsocketClientListener, 
          MediasoupProducerListener, MediasoupConsumerListener, 
          MediasoupDataProducerListener, MediasoupDataConsumerListener {
  private websocketClient: WebsocketClient | undefined;
  private rtpCapabilities: object | undefined;
  private producer: MediasoupProducer | undefined;
  private consumer: MediasoupConsumer | undefined;
  private dataProducer:MediasoupDataProducer | undefined;
  private dataConsumer:MediasoupDataConsumer | undefined;
  private listener: MediasoupDemoListener | undefined;
  private stream: MediaStream | undefined;
  private remoteVideo: HTMLVideoElement | undefined;
  private producerId:string | undefined;
  private dataProducerId:string | undefined;

  constructor(url:string) {
    this.websocketClient = new WebsocketClient(url);
    this.websocketClient.setListener(this);
    this.websocketClient.connect();
  }

  // ===============================================================================
  // WebsocketClientListener
  // ===============================================================================

  onWSOpen() : void {
    console.log('onWSOpen');
    this.listener?.onWSOpen();
  }

  onWSError(event:Event) : void {
    console.log('onWSError', event);
  }

  onWSClose() : void {
    console.log('onWSClose');
    this.listener?.onWSClose();
  }

  onMediasoupRtpCapabilities(payload:any) : void {
    this.rtpCapabilities = payload.rtpCapabilities;
  }

  onMediasoupSendTransport(payload:any) : void {
    this.createProducer(payload, this.stream!);
  }

  onMediasoupRecvTransport(payload:any) : void {
    this.createConsumer(payload, this.remoteVideo!);
  }

  onMediasoupProducer(payload:any): void {
    this.listener?.onProducerId(payload.producerId);
  }

  onMediasoupConsumer(payload:any): void {
    this.consumer?.consume(payload, this.remoteVideo!);
  }

  onMediasoupDataSendTransport(payload:any) : void {
    this.createDataProducer(payload);
  }

  onMediasoupDataRecvTransport(payload:any) : void {
    this.createDataConsumer(payload);
  }

  onMediasoupDataProducer(payload:any) : void {
    this.listener?.onDataProducerId(payload.dataProducerId);
  }

  onMediasoupDataConsumer(payload:any) : void {
    this.dataConsumer?.dataConsume(payload);
  }

  onMediasoupProducerList(payload:any) : void {
    this.listener?.onProducerList(payload.producers);
  }

  onMediasoupDataProducerList(payload:any) : void {
    this.listener?.onDataProducerList(payload.dataProducers);
  }

  // ===============================================================================
  // MediasoupProducerListener
  // ===============================================================================

  onProducerConnected(message:any) : void {
    console.log('onProducerConnected ', message);
    this.websocketClient?.send(JSON.stringify(message));
  }

  onProducerProduce(message:any) : void {
    console.log('onProducerProduce ', message);
    this.websocketClient?.send(JSON.stringify(message));
  }

  // ===============================================================================
  // MediasoupConsumerListener
  // ===============================================================================

  onConsumerConnected(message:any) : void {
    console.log('onConsumerConnected ', message);
    this.websocketClient?.send(JSON.stringify(message));
  }

  onConsumerConsume(message:any) : void {
    console.log('onConsumerConsume ', message);
    this.websocketClient?.send(JSON.stringify(message));
  }

  // ===============================================================================
  // MediasoupDataProducerListener
  // ===============================================================================

  onDataProducerConnected(message:any) : void {
    console.log('onDataProducerConnected ', message);
    this.websocketClient?.send(JSON.stringify(message));
  }

  onDataProducerProduce(message:any) : void {
    console.log('onDataProducerProduce ', message);
    this.websocketClient?.send(JSON.stringify(message));
  }

  // ===============================================================================
  // MediasoupDataConsumerListener
  // ===============================================================================

  onDataConsumerConnected(message:any) : void {
    console.log('onDataConsumerConnected ', message);
    this.websocketClient?.send(JSON.stringify(message));
  }

  onDataConsumerConsume(message:any) : void {
    console.log('onDataConsumerConsume ', message);
    this.websocketClient?.send(JSON.stringify(message));
  }

  onDataConsumerMessage(message:string) : void {
    console.log('onDataConsumerMessage ', message);
    this.listener?.onDataChannelMessage(message);
  }

  // ===============================================================================
  // public
  // ===============================================================================

  setListener(listener:MediasoupDemoListener) : void {
    this.listener = listener;
  }

  isWSConnected() {
    return this.websocketClient?.isConnected();
  }

  setProducerId(producerId:string) : void {
    this.producerId = producerId;
  }

  setDataProducerId(dataProducerId:string) : void {
    this.dataProducerId = dataProducerId;
  }

  setMediaStream(stream:MediaStream) : void {
    this.stream = stream;
  }

  setRemoteVideo(remoteVideo:HTMLVideoElement) : void {
    this.remoteVideo = remoteVideo;
  }

  requestRtpCapabilities() : void {
    this.websocketClient?.send(JSON.stringify({
      type: 'rtpCapabilities'
    }));
  }

  requestGetProducerList() : void {
    this.websocketClient?.send(JSON.stringify({
      type: 'producerList'
    }));
  }

  requestGetDataProducerList() : void {
    this.websocketClient?.send(JSON.stringify({
      type: 'dataProducerList'
    }));
  }

  requestCreateProducer() : void {
    if (this.producer) {
      console.warn('this.producer has already been created.');
      return;
    }
    this.websocketClient?.send(JSON.stringify({
      type: 'createSendTransport'
    }));
  }

  requestCreateConsumer() : void {
    if (this.consumer) {
      console.warn('this.consumer has already been created.');
      return;
    }
    this.websocketClient?.send(JSON.stringify({
      type: 'createRecvTransport'
    }));
  }

  private async createProducer(sendTransport:any, stream: MediaStream) : Promise<void> {
    this.producer = new MediasoupProducer(this.rtpCapabilities!);
    this.producer.setListener(this);
    await this.producer.create(sendTransport);
    await this.producer.produce(stream);
  }

  private async createConsumer(recvTransport:any, video: HTMLVideoElement) : Promise<void> {
    this.consumer = new MediasoupConsumer(this.rtpCapabilities!);
    this.consumer.setListener(this);
    await this.consumer.create(recvTransport, this.producerId!);
  }

  requestCreateDataProducer() : void {
    if (this.dataProducer) {
      console.warn('this.dataProducer has already been created.');
      return;
    }
    this.websocketClient?.send(JSON.stringify({
      type: 'createDataSendTransport'
    }));
  }

  requestCreateDataConsumer() : void {
    if (this.dataConsumer) {
      console.warn('this.dataConsumer has already been created.');
      return;
    }
    this.websocketClient?.send(JSON.stringify({
      type: 'createDataRecvTransport'
    }));
  }

  private async createDataProducer(sendTransport:any) : Promise<void> {
    this.dataProducer = new MediasoupDataProducer(this.rtpCapabilities!);
    this.dataProducer.setListener(this);
    await this.dataProducer.create(sendTransport);
    await this.dataProducer.dataProduce();
  }

  private async createDataConsumer(recvTransport:any) : Promise<void> {
    this.dataConsumer = new MediasoupDataConsumer(this.rtpCapabilities!);
    this.dataConsumer.setListener(this);
    await this.dataConsumer.create(recvTransport, this.dataProducerId!);
  }

  async sendMessage(message:string) : Promise<void> {
    this.dataProducer?.send(message);
  }

  resumeProducer() {
    if (this.producer) {
      // if (this.producer.isPaused()) {
      //   this.producer.resume();
      // } else {
      //   this.producer.pause();
      // }

      this.websocketClient?.send(JSON.stringify({
        type: 'resumeProducer',
        payload: {
          producerId: this.producerId
        }
      }));
    }
  }

  pauseProducer() {
    if (this.producer) {
      // mediasoup-client で producer のミュートを切り替えます。
      // if (this.producer.isPaused()) {
      //   this.producer.resume();
      // } else {
      //   this.producer.pause();
      // }

      this.websocketClient?.send(JSON.stringify({
        type: 'pauseProducer',
        payload: {
          producerId: this.producerId
        }
      }));
    }

    // ブラウザで、音声をミュートにします。
    // if (this.stream) {
    //   const track = this.stream.getAudioTracks()[0];
    //   track.enabled = !track.enabled;
    // }
  }
}
