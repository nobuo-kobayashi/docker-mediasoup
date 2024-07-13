import { createWorker, types as mediasoupTypes } from 'mediasoup';
import { getLogger } from 'log4js';
import * as fs from 'fs';

const logger = getLogger();

// 環境変数から announcedIp を取得します。
// docker-compose.yml で定義しています。
const announcedIp = process.env.MEDIASOUP_IP;

export class Mediasoup {
  private id:string;
  private name:string;
  private webRtcTransportOptions:mediasoupTypes.WebRtcTransportOptions;
  private plainTransportOptions:mediasoupTypes.PlainTransportOptions;
  private worker:any;
  private router:any;
  private transports:Map<string, any> = new Map();
  private producers:Map<string, any> = new Map();
  private consumers:Map<string, any> = new Map();
  private dataProducers:Map<string, any> = new Map();
  private dataConsumers:Map<string, any> = new Map();

  constructor(id:string, name:string) {
    this.id = id;
    this.name = name;
    this.webRtcTransportOptions = {
      listenIps: [
        { ip: "127.0.0.1" },
        { ip: "0.0.0.0" }
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      enableSctp: true,
      initialAvailableOutgoingBitrate: 100000000
    }
    this.plainTransportOptions = {
      listenIp: { ip: "0.0.0.0" }
    }
  }

  getId() : string {
    return this.id;
  }

  getName() : string {
    return this.name;
  }

  private loadConfig(configPath: string): { 
    workerOptions: mediasoupTypes.WorkerSettings, 
    mediaCodecs: mediasoupTypes.RtpCodecCapability[], 
    webRtcTransportOptions: mediasoupTypes.WebRtcTransportOptions, 
    plainTransportOptions: mediasoupTypes.PlainTransportOptions
  } {
    const configFile = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configFile);
  }

  async init(configPath:string) : Promise<void> {
    const { 
      workerOptions, 
      mediaCodecs, 
      webRtcTransportOptions, 
      plainTransportOptions
    } = this.loadConfig(configPath);
    this.webRtcTransportOptions = webRtcTransportOptions;
    this.plainTransportOptions = plainTransportOptions;
    this.worker = await createWorker(workerOptions);
    this.worker.on('died', () => {
      logger.error('mediasoup worker died.');
    });
    this.router = await this.worker.createRouter({ mediaCodecs });
  }

  close() {
    this.deleteAllTransport();
    this.router?.close();
    this.router = undefined;
    this.worker?.close();
    this.worker = undefined;
  }

  getCapabilities() {
    return this.router.rtpCapabilities;
  }

  // Transport

  async createWebRtcTransport() : Promise<any> {
    const transport = await this.router.createWebRtcTransport(this.webRtcTransportOptions);
    transport.observer.on('close', () => {
      if (!this.transports.delete(transport.id)) {
        logger.warn(`Failed to delete a transport. id=${transport.id}`);
      }
    });
    this.transports.set(transport.id, transport);
    return transport;
  }

  async createPlainTransport(payload:any) : Promise<any> {
    const transportOptions = payload;
    const transport = await this.router.createPlainTransport({
      listenIp: this.plainTransportOptions.listenIp,
      rtcpMux : transportOptions.rtcpMux,
      comedia : transportOptions.comedia
    });
    transport.observer.on('close', () => {
      if (!this.transports.delete(transport.id)) {
        logger.warn(`Failed to delete a transport. id=${transport.id}`);
      }
    });
    this.transports.set(transport.id, transport);
    return transport;
  }

  deleteTransport(id:string) : void {
    const transport = this.transports.get(id);
    if (transport) {
      transport.close();
    }
  }

  deleteAllTransport() : void {
    for (const transport of this.transports.values()) {
      transport.close();
    }
    this.transports.clear();
  }

  async connect(payload:any) : Promise<void> {
    const { id, dtlsParameters } = payload;
    const transport = this.transports.get(id);
    await transport.connect({ dtlsParameters });
  }

  // 映像・音声 Producer

  getProducerIds() : IterableIterator<string> {
    return this.producers.keys();
  }

  getProducers() : IterableIterator<any> {
    return this.producers.values();
  }

  findProducer(id:string) : any {
    return this.producers.get(id);
  }

  pauseProducer(id:string) : void {
    const producer = this.findProducer(id);
    if (producer) {
      producer.pause();
    }
  }

  resumeProducer(id:string) : void {
    const producer = this.findProducer(id);
    if (producer) {
      producer.resume();
    }
  }

  async createProducer(payload:any) : Promise<any> {
    try {
      const producerOptions = payload;
      const transport = this.transports.get(producerOptions.id);
      const producer = await transport.produce(producerOptions.parameters);
      producer.observer.on('close', () => {
        if (!this.producers.delete(producer.id)) {
          logger.warn(`Failed to delete a producer. id=${producer.id}`);
        }
      });
      this.producers.set(producer.id, producer);
      return producer;
    } catch (e) {
      logger.error(`Failed to create a Producer. payload:`, payload, e);
    }
    return undefined;
  }

  // 映像・音声 Consumer

  getConsumers() : IterableIterator<string> {
    return this.consumers.keys();
  }

  findConsumer(id:string) : any {
    return this.consumers.get(id);
  }

  pauseConsumer(id:string) : void {
    const consumer = this.findConsumer(id);
    if (consumer) {
      consumer.pause();
    }
  }

  resumeConsumer(id:string) : void {
    const consumer = this.findConsumer(id);
    if (consumer) {
      consumer.resume();
    }
  }

  async createConsumer(payload:any) : Promise<any> {
    try {
      const consumerOptions = payload;

      if (!this.router.canConsume({
        producerId: consumerOptions.producerId, 
        rtpCapabilities: consumerOptions.rtpCapabilities
      })) {
        logger.warn(`Can not consume. payload:`, payload);
        return undefined;
      }

      const transport = this.transports.get(consumerOptions.id);
      const consumer = await transport?.consume({
        producerId: consumerOptions.producerId,
        rtpCapabilities: consumerOptions.rtpCapabilities
      });
      consumer.observer.on('close', () => {
        if (!this.consumers.delete(consumer.id)) {
          logger.warn(`Failed to delete a consumer. id=${consumer.id}`);
        }
      });
      this.consumers.set(consumer.id, consumer);
      return consumer;
    } catch (e) {
      logger.error(`Failed to create a Consumer. payload:`, payload, e);
    }
    return undefined;
  }

  // データチャンネル DataProducer

  getDataProducerIds() : IterableIterator<string> {
    return this.dataProducers.keys();
  }

  getDataProducers() : IterableIterator<any> {
    return this.dataProducers.values();
  }

  findDataProducer(id:string) : any {
    return this.dataProducers.get(id);
  }

  pauseDataProducer(id:string) : void {
    const producer = this.findDataProducer(id);
    if (producer) {
      producer.pause();
    }
  }

  resumeDataProducer(id:string) : void {
    const producer = this.findDataProducer(id);
    if (producer) {
      producer.resume();
    }
  }

  async createDataProducer(payload:any) : Promise<any> {
    try {
      const dataProducerOptions = payload;
      const transport = this.transports.get(dataProducerOptions.id);
      const dataProducer = await transport.produceData(dataProducerOptions.parameters);
      dataProducer.observer.on('close', () => {
        if (!this.dataProducers.delete(dataProducer.id)) {
          logger.warn(`Failed to delete a dataProducer. id=${dataProducer.id}`);
        }
      });
      this.dataProducers.set(dataProducer.id, dataProducer);
      return dataProducer;
    } catch (e) {
      logger.error('Failed to create a DataProducer. payload', payload, e);
    }
    return undefined;
  }

  // データチャンネル DataConsumer

  getDataConsumers() : IterableIterator<string> {
    return this.dataConsumers.keys();
  }

  findDataConsumer(id:string) : any {
    return this.dataConsumers.get(id);
  }

  pauseDataConsumer(id:string) : void {
    const consumer = this.findDataConsumer(id);
    if (consumer) {
      consumer.pause();
    }
  }

  resumeDataConsumer(id:string) : void {
    const consumer = this.findDataConsumer(id);
    if (consumer) {
      consumer.resume();
    }
  }

  async createDataConsumer(payload:any) : Promise<any> {
    try {
      const dataConsumerOptions = payload;
      const transport = this.transports.get(dataConsumerOptions.id);
      const dataConsumer = await transport.consumeData({
        dataProducerId: dataConsumerOptions.dataProducerId
      });
      dataConsumer.observer.on('close', () => {
        if (!this.dataConsumers.delete(dataConsumer.id)) {
          logger.warn(`Failed to delete a dataConsumer. id=${dataConsumer.id}`);
        }
      });
      this.dataConsumers.set(dataConsumer.id, dataConsumer);
      return dataConsumer;
    } catch (e) {
      logger.error(`Failed to create a DataConsumer. payloa:`, payload, e);
    }
    return undefined;
  }
}
