const { createWorker } = require('mediasoup');

// 環境変数から announcedIp を取得します。
// docker-compose.yml で定義しています。
const announcedIp = process.env.MEDIASOUP_IP;

export class Mediasoup {
  private id:string;
  private worker:any;
  private router:any;
  private transports:Map<string, any>;
  private producers:Map<string, any>;
  private dataProducers:Map<string, any>;

  constructor(id:string) {
    this.id = id;
    this.transports = new Map();
    this.producers = new Map();
    this.dataProducers = new Map();
  }

  getId() : string {
    return this.id;
  }

  async init() : Promise<void> {
    // rtcMinPort と rtcMaxPort は、docker-compose.yml で定義している ports の値と合わせる必要があります。
    const workerOptions = {
      rtcMinPort: 40000,  // WebRTC で使用するポート番号の下限値
      rtcMaxPort: 40100,  // WebRTC で使用するポート番号の上限値
      logLevel: 'warn',
      logTags: [
        'info',
        'ice',
        'dtls',
        'rtp',
        'srtp',
        'rtcp',
        'rtx',
        'bwe',
        'score',
        'simulcast',
        'svc'
      ],
    };

    // mediasoup で使用するメディアのコーデックを指定します。
    const mediaCodecs = [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000
        }
      },
      {
        kind: 'video',
        mimeType: 'video/H264',
        clockRate: 90000
      }
    ];

    this.worker = await createWorker(workerOptions);
    this.worker.on('died', () => {
      console.error('mediasoup worker died.');
    });
    this.router = await this.worker.createRouter({ mediaCodecs });
  }

  close() : void {
    this.deleteAllTransport();
    this.router?.close();
    this.router = undefined;
    this.worker?.close();
    this.worker = undefined;
  }

  getCapabilities() {
    return this.router.rtpCapabilities;
  }

  async createWebRtcTransport() : Promise<any> {
    const transport = await this.router.createWebRtcTransport({
      listenIps: [
        { ip: '127.0.0.1' },
        { ip: '0.0.0.0', announcedIp: announcedIp }
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      enableSctp: true, // datachannels
      initialAvailableOutgoingBitrate: 100000000
    });

    this.transports.set(transport.id, transport);

    return transport;
  }

  async createPlainTransport(payload:any) : Promise<any> {
    const transportOptions = payload;
    const transport = await this.router.createPlainTransport({
      listenIp: { ip: '0.0.0.0', announcedIp: announcedIp },
      rtcpMux : transportOptions.rtcpMux,
      comedia : transportOptions.comedia
    });

    this.transports.set(transport.id, transport);

    return transport;
  }

  deleteTransport(id:string) : void {
    const transport = this.transports.get(id);
    if (transport) {
      this.transports.delete(id);
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

  // 映像・音声

  getProducers() : IterableIterator<string> {
    return this.producers.keys();
  }

  findProducer(id:string) : any {
    return this.producers.get(id);
  }

  async createProducer(payload:any) : Promise<any> {
    try {
      const producerOptions = payload;
      const transport = this.transports.get(producerOptions.id);
      const producer = await transport.produce(producerOptions.parameters);
      producer.observer.on('close', () => {
        this.producers.delete(producer.id);
      });
      this.producers.set(producer.id, producer);
      return producer;
    } catch (e) {
      console.log('Failed to create a Producer.', e);
    }
    return undefined;
  }

  pauseProducer(producerId:string) : void {
    const producer = this.findProducer(producerId);
    if (producer) {
      producer.pause();
    }
  }

  resumeProducer(producerId:string) : void {
    const producer = this.findProducer(producerId);
    if (producer) {
      producer.resume();
    }
  }

  async createConsumer(payload:any) : Promise<any> {
    try {
      const consumerOptions = payload;

      if (!this.router.canConsume({
        'producerId': consumerOptions.producerId, 
        'rtpCapabilities': consumerOptions.rtpCapabilities
      })) {
        return undefined;
      }

      const transport = this.transports.get(consumerOptions.id);
      const consumer = await transport?.consume({
        'producerId': consumerOptions.producerId,
        'rtpCapabilities': consumerOptions.rtpCapabilities
      });
      return consumer;
    } catch (e) {
      console.log('Failed to create a Consumer.', e);
    }
    return undefined;
  }

  // データチャンネル

  getDataProducers() : IterableIterator<string> {
    return this.dataProducers.keys();
  }

  async createDataProducer(payload:any) : Promise<any> {
    try {
      const dataProducerOptions = payload;
      const transport = this.transports.get(dataProducerOptions.id);
      const dataProducer = await transport.produceData(dataProducerOptions.parameters);
      dataProducer.observer.on('close', () => {
        this.dataProducers.delete(dataProducer.id);
      })
      this.dataProducers.set(dataProducer.id, dataProducer);
      return dataProducer;
    } catch (e) {
      console.log('Failed to create a DataProducer', e);
    }
    return undefined;
  }

  async createDataConsumer(payload:any) : Promise<any> {
    try {
      const dataConsumerOptions = payload;
      const transport = this.transports.get(dataConsumerOptions.id);
      const dataConsumer = await transport.consumeData({
        'dataProducerId': dataConsumerOptions.dataProducerId
      });
      return dataConsumer;
    } catch (e) {
      console.log('Failed to create a DataConsumer', e);
    }
    return undefined;
  }
}
