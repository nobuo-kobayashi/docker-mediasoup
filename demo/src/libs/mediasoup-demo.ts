import { WSEvent } from "./websocket-client";
import { MediasoupProducer, ProducerEvent } from "./mediasoup-producer";
import { MediasoupConsumer, ConsumerEvent } from "./mediasoup-consumer";
import { MediasoupDataProducer, DataProducerEvent } from "./mediasoup-dataproducer";
import { MediasoupDataConsumer, DataConsumerEvent } from "./mediasoup-dataconsumer";
import { MediasoupEventEmitter } from './mediasoup-events';
import { MediasoupWebsocket } from "./mediasoup-websocket";

export const DemoEvent = {
  KEY_WS_OPEN: 'ws-open',
  KEY_WS_ERROR: 'ws-error',
  KEY_WS_CLOSE: 'ws-close',
  KEY_ON_MESSAGE: 'data-channel-message',
}

export class MediasoupDemo extends MediasoupEventEmitter {
  private websocket?:MediasoupWebsocket;
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
    this.websocket = new MediasoupWebsocket(url);
    this.websocket.on(WSEvent.KEY_WS_OPENED, this.onWSOpen.bind(this));
    this.websocket.on(WSEvent.KEY_WS_CLOSED, this.onWSClose.bind(this));
    this.websocket.on(WSEvent.KEY_WS_ERROR, this.onWSError.bind(this));
    this.websocket.connect();
  }

  // ===============================================================================
  // WebsocketClient Callbacks
  // ===============================================================================

  onWSOpen() : void {
    this.emit(DemoEvent.KEY_WS_OPEN);
  }

  onWSError(event:Event) : void {
    this.emit(DemoEvent.KEY_WS_ERROR, event);
  }

  onWSClose() : void {
    this.emit(DemoEvent.KEY_WS_CLOSE);
  }

  // ===============================================================================
  // public
  // ===============================================================================

  isWSConnected() {
    return this.websocket?.isConnected();
  }

  async requestRtpCapabilities() : Promise<void> {
    const response = await this.websocket?.sendMessage(JSON.stringify({
      type: 'rtpCapabilities'
    }));
    this.rtpCapabilities = response.rtpCapabilities;
  }

  async requestGetProducerList() : Promise<any> {
    const response = await this.websocket?.sendMessage(JSON.stringify({
      type: 'producerList'
    }));
    return response.producers;
  }

  async requestGetDataProducerList() : Promise<any> {
    const response = await this.websocket?.sendMessage(JSON.stringify({
      type: 'dataProducerList'
    }));
    return response.dataProducers;
  }

  async requestCreateProducer(stream:MediaStream) : Promise<void> {
    if (this.producer) {
      console.warn('this.producer has already been created.');
      return;
    }

    if (!stream) {
      console.warn('stream not set.');
      return;
    }

    this.stream = stream;

    const response = await this.createWebRtcTransport();
    this.createProducer(response, this.stream);
  }

  async destroyProducer() : Promise<void> {
    if (!this.producer) {
      console.warn('this.producer not initialized.');
      return;
    }

    await this.destroyWebRtcTransport(this.producer.getTransportId());

    this.producer.close();
    this.producer = undefined;
  }

  async requestCreateConsumer(producerId:string, remoteVideo:HTMLVideoElement) : Promise<void> {
    if (this.consumer) {
      console.warn('this.consumer has already been created.');
      return;
    }

    if (!producerId) {
      console.warn('producerId not set.');
      return;
    }
    
    if (!remoteVideo) {
      console.warn('remoteVideo not set.');
      return;
    }

    this.producerId = producerId;
    this.remoteVideo = remoteVideo;

    const response = await this.createWebRtcTransport();
    await this.createConsumer(response, this.remoteVideo);
  }

  async destroyConsumer() : Promise<void> {
    if (!this.consumer) {
      console.warn('this.consumer not initialized.');
      return;
    }

    await this.destroyWebRtcTransport(this.consumer.getTransportId());

    this.consumer.close();
    this.consumer = undefined;
  }

  async requestCreateDataProducer() : Promise<void> {
    if (this.dataProducer) {
      console.warn('this.dataProducer has already been created.');
      return;
    }

    const response = await this.createWebRtcTransport();
    await this.createDataProducer(response);
  }

  async destroyDataProducer() : Promise<void> {
    if (!this.dataProducer) {
      console.warn('this.dataProducer not initialized.');
      return;
    }

    await this.destroyWebRtcTransport(this.dataProducer.getTransportId());

    this.dataProducer.close();
    this.dataProducer = undefined;
  }

  async requestCreateDataConsumer(dataProducerId:string) : Promise<void> {
    if (this.dataConsumer) {
      console.warn('this.dataConsumer has already been created.');
      return;
    }

    if (!dataProducerId) {
      console.warn('dataProducerId is not set.');
      return;
    }

    this.dataProducerId = dataProducerId;

    const response = await this.createWebRtcTransport();
    await this.createDataConsumer(response);
  }

  async destroyDataConsumer() : Promise<void> {
    if (!this.dataConsumer) {
      console.warn('this.dataConsumer not initialized.');
      return;
    }

    await this.destroyWebRtcTransport(this.dataConsumer.getTransportId());

    this.dataConsumer.close();
    this.dataConsumer = undefined;
  }

  private async createWebRtcTransport() {
    return await this.websocket?.sendMessage(JSON.stringify({
      type: 'createWebRtcTransport'
    }));
  }

  private async destroyWebRtcTransport(id?:string) {
    if (!id) {
      console.warn('transport.id not set.');
      return;
    }
    return await this.websocket?.sendMessage(JSON.stringify({
      type: 'destroyWebRtcTransport',
      payload: {
        id: id
      }
    }));
  }

  private async createProducer(sendTransport:any, stream: MediaStream) : Promise<void> {
    if (!this.rtpCapabilities) {
      throw new Error('rtpCapabilities is not initialized.');
    }

    this.producer = new MediasoupProducer(this.rtpCapabilities);
    this.producer.on(ProducerEvent.KEY_PRODUCER_CONNECT, async (message:any) => {
      await this.websocket?.sendMessage(JSON.stringify(message));
    });
    this.producer.on(ProducerEvent.KEY_PRODUCER_PRODUCE, async (message:any) => {
      await this.websocket?.sendMessage(JSON.stringify(message));
    });
    await this.producer.create(sendTransport);
    await this.producer.produce(stream);
  }

  private async createConsumer(recvTransport:any, video:HTMLVideoElement) : Promise<void> {
    if (!this.rtpCapabilities) {
      throw new Error('rtpCapabilities is not initialized.');
    }
    if (!this.producerId) {
      throw new Error('producerId is not initialized.');
    }

    this.consumer = new MediasoupConsumer(this.rtpCapabilities);
    this.consumer.on(ConsumerEvent.KEY_CONSUMER_CONNECTED, async (message:any) => {
      const response = await this.websocket?.sendMessage(JSON.stringify(message));
      console.log('connect ', response);
    });
    this.consumer.on(ConsumerEvent.KEY_CONSUMER_CONSUME, async (message:any) => {
      const response = await this.websocket?.sendMessage(JSON.stringify(message));
      console.log('consumer ', response);
      await this.consumer?.consume(response);
      this.consumer?.play(video);
    });
    await this.consumer.create(recvTransport, this.producerId);
  }

  private async createDataProducer(sendTransport:any) : Promise<void> {
    if (!this.rtpCapabilities) {
      throw new Error('rtpCapabilities is not initialized.');
    }

    this.dataProducer = new MediasoupDataProducer(this.rtpCapabilities);
    this.dataProducer.on(DataProducerEvent.KEY_DATA_PRODUCER_CONNECTED, async (message:any) => {
      await this.websocket?.sendMessage(JSON.stringify(message));
    });
    this.dataProducer.on(DataProducerEvent.KEY_DATA_PRODUCER_PRODUCE, async (message:any) => {
      await this.websocket?.sendMessage(JSON.stringify(message));
    });
    await this.dataProducer.create(sendTransport);
    await this.dataProducer.dataProduce();
  }

  private async createDataConsumer(recvTransport:any) : Promise<void> {
    if (!this.rtpCapabilities) {
      throw new Error('rtpCapabilities is not initialized.');
    }
    if (!this.dataProducerId) {
      throw new Error('dataProducerId is not initialized.');
    }

    this.dataConsumer = new MediasoupDataConsumer(this.rtpCapabilities);
    this.dataConsumer.on(DataConsumerEvent.KEY_DATA_CONSUMER_CONNECTED, async (message:any) => {
      await this.websocket?.sendMessage(JSON.stringify(message));
    });
    this.dataConsumer.on(DataConsumerEvent.KEY_DATA_CONSUMER_CONSUME, async (message:any) => {
      const response = await this.websocket?.sendMessage(JSON.stringify(message));
      await this.dataConsumer?.dataConsume(response);
    });
    this.dataConsumer.on(DataConsumerEvent.KEY_DATA_CONSUMER_MESSAGE, (message:string) => {
      this.emit(DemoEvent.KEY_ON_MESSAGE, message);
    });
    await this.dataConsumer.create(recvTransport, this.dataProducerId);
  }

  async sendMessage(message:string) : Promise<void> {
    this.dataProducer?.send(message);
  }

  resumeProducer() {
    if (this.producer) {
      this.producer.resume();
      this.websocket?.sendMessage(JSON.stringify({
        type: 'resumeProducer',
        payload: {
          producerId: this.producerId
        }
      }));
    }
  }

  pauseProducer() {
    if (this.producer) {
      this.producer.pause();
      this.websocket?.sendMessage(JSON.stringify({
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
