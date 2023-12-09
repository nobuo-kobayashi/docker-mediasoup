import { WebsocketClient, WSEvent } from "./websocket-client";
import { MediasoupProducer, ProducerEvent } from "./mediasoup-producer";
import { MediasoupConsumer, ConsumerEvent } from "./mediasoup-consumer";
import { MediasoupDataProducer, DataProducerEvent } from "./mediasoup-dataproducer";
import { MediasoupDataConsumer, DataConsumerEvent } from "./mediasoup-dataconsumer";
import { MediasoupEventEmitter } from './mediasoup-events';

export const DemoEvent = {
  KEY_WS_OPEN: 'ws-open',
  KEY_WS_CLOSE: 'ws-close',
  KEY_ON_PRODUCER_ID: 'producer-id',
  KEY_ON_DATA_PRODUCER_ID: 'data-producer-id',
  KEY_ON_MESSAGE: 'data-channel-message',
  KEY_ON_PRODUCER_LIST: 'producer-list',
  KEY_ON_DATA_PRODUCER_LIST: 'data-producer-list',
}

export class MediasoupDemo extends MediasoupEventEmitter {
  private websocketClient?:WebsocketClient;
  private rtpCapabilities?:object;
  private producer?:MediasoupProducer;
  private consumer?:MediasoupConsumer;
  private dataProducer?:MediasoupDataProducer;
  private dataConsumer?:MediasoupDataConsumer;
  private stream?:MediaStream;
  private remoteVideo?:HTMLVideoElement;
  private producerId?:string;
  private dataProducerId?:string;

  constructor(url:string) {
    super();
    this.websocketClient = new WebsocketClient(url);
    this.websocketClient.on(WSEvent.KEY_WS_OPENED, this.onWSOpen.bind(this));
    this.websocketClient.on(WSEvent.KEY_WS_CLOSED, this.onWSClose.bind(this));
    this.websocketClient.on(WSEvent.KEY_WS_ERROR, this.onWSError.bind(this));
    this.websocketClient.on(WSEvent.KEY_RTP_CAPABILITIES, this.onMediasoupRtpCapabilities.bind(this));
    this.websocketClient.on(WSEvent.KEY_SEND_TRANSPORT, this.onMediasoupSendTransport.bind(this));
    this.websocketClient.on(WSEvent.KEY_SECV_TRANSPORT, this.onMediasoupRecvTransport.bind(this));
    this.websocketClient.on(WSEvent.KEY_PRODUCER, this.onMediasoupProducer.bind(this));
    this.websocketClient.on(WSEvent.KEY_CONSUMER, this.onMediasoupConsumer.bind(this));
    this.websocketClient.on(WSEvent.KEY_DATA_SEND_TRANSPORT, this.onMediasoupDataSendTransport.bind(this));
    this.websocketClient.on(WSEvent.KEY_DATA_RECV_TRANSPORT, this.onMediasoupDataRecvTransport.bind(this));
    this.websocketClient.on(WSEvent.KEY_DATA_PRODUCER, this.onMediasoupDataProducer.bind(this));
    this.websocketClient.on(WSEvent.KEY_DATA_CONSUMER, this.onMediasoupDataConsumer.bind(this));
    this.websocketClient.on(WSEvent.KEY_PRODUCER_LIST, this.onMediasoupProducerList.bind(this));
    this.websocketClient.on(WSEvent.KEY_DATA_PRODUCER_LIST, this.onMediasoupDataProducerList.bind(this));
    this.websocketClient.connect();
  }

  // ===============================================================================
  // WebsocketClient Callbacks
  // ===============================================================================

  onWSOpen() : void {
    this.emit(DemoEvent.KEY_WS_OPEN);
  }

  onWSError(event:Event) : void {
    console.log('onWSError', event);
  }

  onWSClose() : void {
    this.emit(DemoEvent.KEY_WS_CLOSE);
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
    this.emit(DemoEvent.KEY_ON_PRODUCER_ID, payload.producerId);
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
    this.emit(DemoEvent.KEY_ON_DATA_PRODUCER_ID, payload.dataProducerId);
  }

  onMediasoupDataConsumer(payload:any) : void {
    this.dataConsumer?.dataConsume(payload);
  }

  onMediasoupProducerList(payload:any) : void {
    this.emit(DemoEvent.KEY_ON_PRODUCER_LIST, payload.producers);
  }

  onMediasoupDataProducerList(payload:any) : void {
    this.emit(DemoEvent.KEY_ON_DATA_PRODUCER_LIST, payload.dataProducers);
  }

  // ===============================================================================
  // MediasoupProducer Callbacks
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
  // MediasoupConsumer Callbacks
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
  // MediasoupDataProducer Callbacks
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
  // MediasoupDataConsumer Callbacks
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
    this.emit(DemoEvent.KEY_ON_MESSAGE, message);
  }

  // ===============================================================================
  // public
  // ===============================================================================

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
    if (!this.rtpCapabilities) {
      throw 'rtpCapabilities is not initialized.';
    }
    this.producer = new MediasoupProducer(this.rtpCapabilities);
    this.producer.on(ProducerEvent.KEY_PRODUCER_CONNECT, this.onProducerConnected.bind(this));
    this.producer.on(ProducerEvent.KEY_PRODUCER_PRODUCE, this.onProducerProduce.bind(this));
    await this.producer.create(sendTransport);
    await this.producer.produce(stream);
  }

  private async createConsumer(recvTransport:any, video:HTMLVideoElement) : Promise<void> {
    if (!this.rtpCapabilities) {
      throw 'rtpCapabilities is not initialized.';
    }
    if (!this.producerId) {
      throw 'producerId is not initialized.';
    }
    this.consumer = new MediasoupConsumer(this.rtpCapabilities);
    this.consumer.on(ConsumerEvent.KEY_CONSUMER_CONNECTED, this.onConsumerConnected.bind(this));
    this.consumer.on(ConsumerEvent.KEY_CONSUMER_CONSUME, this.onConsumerConsume.bind(this));
    await this.consumer.create(recvTransport, this.producerId);
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
    if (!this.rtpCapabilities) {
      throw 'rtpCapabilities is not initialized.';
    }
    this.dataProducer = new MediasoupDataProducer(this.rtpCapabilities);
    this.dataProducer.on(DataProducerEvent.KEY_DATA_PRODUCER_CONNECTED, this.onDataProducerConnected.bind(this));
    this.dataProducer.on(DataProducerEvent.KEY_DATA_PRODUCER_PRODUCE, this.onDataProducerProduce.bind(this));
    await this.dataProducer.create(sendTransport);
    await this.dataProducer.dataProduce();
  }

  private async createDataConsumer(recvTransport:any) : Promise<void> {
    if (!this.rtpCapabilities) {
      throw 'rtpCapabilities is not initialized.';
    }
    if (!this.dataProducerId) {
      throw 'dataProducerId is not initialized.';
    }
    this.dataConsumer = new MediasoupDataConsumer(this.rtpCapabilities);
    this.dataConsumer.on(DataConsumerEvent.KEY_DATA_CONSUMER_CONNECTED, this.onDataConsumerConnected.bind(this));
    this.dataConsumer.on(DataConsumerEvent.KEY_DATA_CONSUMER_CONSUME, this.onConsumerConsume.bind(this));
    this.dataConsumer.on(DataConsumerEvent.KEY_DATA_CONSUMER_MESSAGE, this.onDataConsumerMessage.bind(this));
    await this.dataConsumer.create(recvTransport, this.dataProducerId);
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
