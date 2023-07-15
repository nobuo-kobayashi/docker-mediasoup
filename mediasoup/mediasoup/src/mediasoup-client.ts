import { WebsocketClient, WebsocketClientLister } from "./websocket-client";
import { MediasoupManager } from "./mediasoup-manager";

const MEDIASOUP_ID = 'mediasoup001';

export class MediasoupClient implements WebsocketClientLister {
  private manager:MediasoupManager;
  private client:WebsocketClient;
  private transports:Array<any>;

  constructor(manager:MediasoupManager, client:WebsocketClient) {
    this.manager = manager;
    this.client = client;
    this.client.setListener(this);
    this.transports = new Array();
  }

  onClose(): void {
    // Websocket の接続が切れたら、mediasoup の設定を削除します。
    for (let transport of this.transports) {
      this.manager.deleteTransport(MEDIASOUP_ID, transport.id);
    }
  }

  onMessage(message:string) : void {
    let json = null;
    try {
      json = JSON.parse(message);
    } catch (e) {
      console.error('Failed to parse a json: ' + message, e);
      return;
    }

    console.log('@@ ' + message);

    switch (json.type) {
      case 'rtpCapabilities':
        this.getRtpCapabilities(MEDIASOUP_ID);
        break;
      case 'createSendTransport':
        this.createSendTransport(MEDIASOUP_ID);
        break;
      case 'createRecvTransport':
        this.createRecvTransport(MEDIASOUP_ID);
        break;
      case 'connect':
        this.connect(MEDIASOUP_ID, json.payload);
        break;
      case 'produce':
        this.createProducer(MEDIASOUP_ID, json.payload);
        break;
      case 'consume':
        this.createConsumer(MEDIASOUP_ID, json.payload);
        break;
      case 'createDataSendTransport':
        this.createDataSendTransport(MEDIASOUP_ID);
        break;
      case 'createDataRecvTransport':
        this.createDataRecvTransport(MEDIASOUP_ID);
        break;
      case 'dataProduce':
        this.createDataProducer(MEDIASOUP_ID, json.payload);
        break;
      case 'dataConsume':
        this.createDataConsumer(MEDIASOUP_ID, json.payload);
        break;
      case 'producerList':
        this.getProducers(MEDIASOUP_ID);
        break;
      case 'dataProducerList':
        this.getDataProducers(MEDIASOUP_ID);
        break;
      case 'createSendPlainTransport':
        this.createSendPlainTransport(MEDIASOUP_ID, json.payload);
        break;
      case 'createRecvPlainTransport':
        this.createRecvPlainTransport(MEDIASOUP_ID, json.payload);
        break;
      case 'pauseProducer':
        this.pauseProducer(MEDIASOUP_ID, json.payload);
        break;
      case 'resumeProducer':
        this.resumeProducer(MEDIASOUP_ID, json.payload);
        break;
      default:
        console.warn('Unkown type. type=' + json.type);
        break;
    }
  }

  send(message:any) {
    if (typeof(message) != 'string') {
      message = JSON.stringify(message);
    }

    console.log('## send', message);

    this.client.send(message);
  }

  async getRtpCapabilities(id:string) : Promise<void> {
    const capabilities:any = await this.manager.getCapabilities(id);
    this.send({
      'type': 'rtpCapabilities',
      'payload': {
        'rtpCapabilities': capabilities
      }
    });
  }

  async createSendTransport(id:string) : Promise<void> {
    const sendTransport:any = await this.manager.createWebRtcTransport(id);
    if (sendTransport) {
      this.transports.push(sendTransport);
      this.send({
        'type': 'sendTransport',
        'payload': {
          'id': sendTransport.id,
          'iceParameters': sendTransport.iceParameters,
          'iceCandidates': sendTransport.iceCandidates,
          'dtlsParameters': sendTransport.dtlsParameters
        }
      });
    }
  }

  async createRecvTransport(id:string) : Promise<void> {
    const recvTransport:any = await this.manager.createWebRtcTransport(id);
    if (recvTransport) {
      this.transports.push(recvTransport);
      this.send({
        'type': 'recvTransport',
        'payload': {
          'id': recvTransport.id,
          'iceParameters': recvTransport.iceParameters,
          'iceCandidates': recvTransport.iceCandidates,
          'dtlsParameters': recvTransport.dtlsParameters
        }
      });
    }
  }

  async connect(id:string, payload:any) : Promise<void> {
    await this.manager.connect(id, payload);
  }

  async createDataSendTransport(id:string) : Promise<void> {
    const sendTransport:any = await this.manager.createWebRtcTransport(id);
    if (sendTransport) {
      this.transports.push(sendTransport);
      this.send({
        'type': 'dataSendTransport',
        'payload': {
          'id': sendTransport.id,
          'iceParameters': sendTransport.iceParameters,
          'iceCandidates': sendTransport.iceCandidates,
          'dtlsParameters': sendTransport.dtlsParameters,
          'sctpParameters': sendTransport.sctpParameters,
        }
      });
    }
  }

  async createDataRecvTransport(id:string) : Promise<void> {
    const recvTransport:any = await this.manager.createWebRtcTransport(id);
    if (recvTransport) {
      this.transports.push(recvTransport);
      this.send({
        'type': 'dataRecvTransport',
        'payload': {
          'id': recvTransport.id,
          'iceParameters': recvTransport.iceParameters,
          'iceCandidates': recvTransport.iceCandidates,
          'dtlsParameters': recvTransport.dtlsParameters,
          'sctpParameters': recvTransport.sctpParameters,
        }
      });
    }
  }

  async createSendPlainTransport(id:string, payload:any) : Promise<void> {
    const plainTransport:any = await this.manager.createPlainTransport(id, payload);
    if (plainTransport) {
      this.transports.push(plainTransport);
      this.send({
        'type': 'sendPlainTransport',
        'payload': {
          'id': plainTransport.id,
          'ip': plainTransport.tuple.localIp,
          'port': plainTransport.tuple.localPort,
          'rtcpPort': plainTransport.rtcpTuple ? plainTransport.rtcpTuple.localPort : undefined
        }
      });
    }
  }

  async createRecvPlainTransport(id:string, payload:any) : Promise<void> {
    const plainTransport:any = await this.manager.createPlainTransport(id, payload);
    if (plainTransport) {
      this.transports.push(plainTransport);
      this.send({
        'type': 'recvPlainTransport',
        'payload': {
          'id': plainTransport.id,
          'ip': plainTransport.tuple.localIp,
          'port': plainTransport.tuple.localPort,
          'rtcpPort': plainTransport.rtcpTuple ? plainTransport.rtcpTuple.localPort : undefined
        }
      });
    }
  }

  async getProducers(id:string) : Promise<void> {
    const producers = await this.manager.getProducers(id);
    if (producers) {
      let producerList = [];
      for (const producerId of producers) {
        producerList.push(producerId)
      }
      this.send({
        'type': 'producerList',
        'payload': {
          'producers': producerList
        }
      });
    }
  }

  async createProducer(id:string, payload:any) : Promise<void> {
    const producer:any = await this.manager.createProducer(id, payload);
    if (producer) {
      this.send({
        'type': 'producer',
        'payload': {
          'producerId': producer.id
        }
      });
    }
  }

  async createConsumer(id:string, payload:any) : Promise<void> {
    const consumer:any = await this.manager.createConsumer(id, payload);
    if (consumer) {
      this.send({
        'type': 'consumer',
        'payload': {
          'id': consumer.id,
          'producerId': id,
          'kind': consumer.kind,
          'type': consumer.type,
          'rtpParameters': consumer.rtpParameters
        }
      });
    }
  }

  async getDataProducers(id:string) : Promise<void> {
    const producers = await this.manager.getDataProducers(id);
    if (producers) {
      let producerList = [];
      for (const producerId of producers) {
        producerList.push(producerId)
      }
      this.send({
        'type': 'dataProducerList',
        'payload': {
          'dataProducers': producerList
        }
      });
    }
  }

  async createDataProducer(id:string, payload:any) : Promise<void> {
    const dataProducer = await this.manager.createDataProducer(id, payload);
    if (dataProducer) {
      this.send({
        'type': 'dataProducer',
        'payload': {
          'dataProducerId': dataProducer.id
        }
      });
    }
  }

  async createDataConsumer(id:string, payload:any) : Promise<void> {
    const dataConsumer = await this.manager.createDataConsumer(id, payload);
    if (dataConsumer) {
      this.send({
        'type': 'dataConsumer',
        'payload': {
          'id': dataConsumer.id,
          'dataProducerId': dataConsumer.dataProducerId,
          'sctpStreamParameters': dataConsumer.sctpStreamParameters,
          'label': dataConsumer.label,
          'protocol': dataConsumer.protocol,
        }
      });
    }
  }

  async pauseProducer(id:string, payload:any) : Promise<void> {
    await this.manager.pauseProducer(id, payload.producerId);
  }

  async resumeProducer(id:string, payload:any) : Promise<void> {
    await this.manager.resumeProducer(id, payload.producerId);
  }
}
