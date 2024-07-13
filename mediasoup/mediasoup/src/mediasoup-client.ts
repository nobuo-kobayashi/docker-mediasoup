import { WebsocketClient, WSClientEvent } from "./websocket-client";
import { MediasoupManager } from "./mediasoup-manager";
import { getLogger } from "log4js";

const logger = getLogger();
const accessLogger = getLogger('access');

const MEDIASOUP_ID = 'mediasoup001';

export class MediasoupClient {
  private manager:MediasoupManager;
  private client:WebsocketClient;
  private transports:Array<any> = new Array();
  private funcMap:Map<string, any> = new Map();

  constructor(manager:MediasoupManager, client:WebsocketClient) {
    this.manager = manager;
    this.client = client;
    this.client.on(WSClientEvent.KEY_ON_CLOSE, this.onClose.bind(this));
    this.client.on(WSClientEvent.KEY_ON_MESSAGE, this.onMessage.bind(this));

    // {
    //   type: 'XXXX',
    //   payload: {}
    // }

    this.funcMap.set('createSession', this.createMediaSession.bind(this));
    this.funcMap.set('rtpCapabilities', this.getRtpCapabilities.bind(this));
    this.funcMap.set('createSendTransport', this.createSendTransport.bind(this));
    this.funcMap.set('createRecvTransport', this.createRecvTransport.bind(this));
    this.funcMap.set('connect', this.connect.bind(this));
    this.funcMap.set('produce', this.createProducer.bind(this));
    this.funcMap.set('consume', this.createConsumer.bind(this));
    this.funcMap.set('createDataSendTransport', this.createDataSendTransport.bind(this));
    this.funcMap.set('createDataRecvTransport', this.createDataRecvTransport.bind(this));
    this.funcMap.set('dataProduce', this.createDataProducer.bind(this));
    this.funcMap.set('dataConsume', this.createDataConsumer.bind(this));
    this.funcMap.set('producerList', this.getProducers.bind(this));
    this.funcMap.set('dataProducerList', this.getDataProducers.bind(this));
    this.funcMap.set('createSendPlainTransport', this.createSendPlainTransport.bind(this));
    this.funcMap.set('createRecvPlainTransport', this.createRecvPlainTransport.bind(this));
    this.funcMap.set('pauseProducer', this.pauseProducer.bind(this));
    this.funcMap.set('resumeProducer', this.resumeProducer.bind(this));
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
      logger.error('Failed to parse a json: ' + message, e);
      return;
    }

    accessLogger.log(`C[${this.client.getRemoteIPAddress()}] -> S recv: ${message}`);

    const func = this.funcMap.get(json.type);
    if (func) {
      func(MEDIASOUP_ID, json.payload);
    } else {
      console.warn('Unkown type. type=' + json.type);
    }
  }

  send(message:any) {
    if (typeof(message) != 'string') {
      message = JSON.stringify(message);
    }

    accessLogger.log(`S -> C[${this.client.getRemoteIPAddress()}] send: ${message}`);

    this.client.send(message);
  }

  private createRandomString() {
    const S = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const L = 32;
    let rnd = '';
    for (let i = 0; i < L; i++) {
      rnd += S.charAt(Math.floor(Math.random() * S.length));
    }
    return rnd;
  }

  async createMediaSession(_:string, payload:any) : Promise<void> {
    const id = this.createRandomString();
    const { name } = payload;
    const mediasoup = await this.manager.getOrCreateMediasoup(id);
    this.send({
      type: 'createSession',
      payload: {
        id: mediasoup.getId()
      }
    })
  }

  async getRtpCapabilities(id:string, _:any) : Promise<void> {
    const capabilities:any = await this.manager.getCapabilities(id);
    this.send({
      type: 'rtpCapabilities',
      payload: {
        rtpCapabilities: capabilities
      }
    });
  }

  async createSendTransport(id:string, _:any) : Promise<void> {
    const sendTransport:any = await this.manager.createWebRtcTransport(id);
    if (sendTransport) {
      this.transports.push(sendTransport);
      this.send({
        type: 'sendTransport',
        payload: {
          id: sendTransport.id,
          iceParameters: sendTransport.iceParameters,
          iceCandidates: sendTransport.iceCandidates,
          dtlsParameters: sendTransport.dtlsParameters
        }
      });
    }
  }

  async createRecvTransport(id:string, _:any) : Promise<void> {
    const recvTransport:any = await this.manager.createWebRtcTransport(id);
    if (recvTransport) {
      this.transports.push(recvTransport);
      this.send({
        type: 'recvTransport',
        payload: {
          id: recvTransport.id,
          iceParameters: recvTransport.iceParameters,
          iceCandidates: recvTransport.iceCandidates,
          dtlsParameters: recvTransport.dtlsParameters
        }
      });
    }
  }

  async connect(id:string, payload:any) : Promise<void> {
    await this.manager.connect(id, payload);
  }

  async createDataSendTransport(id:string, _:any) : Promise<void> {
    const sendTransport:any = await this.manager.createWebRtcTransport(id);
    if (sendTransport) {
      this.transports.push(sendTransport);
      this.send({
        type: 'dataSendTransport',
        payload: {
          id: sendTransport.id,
          iceParameters: sendTransport.iceParameters,
          iceCandidates: sendTransport.iceCandidates,
          dtlsParameters: sendTransport.dtlsParameters,
          sctpParameters: sendTransport.sctpParameters,
        }
      });
    }
  }

  async createDataRecvTransport(id:string, _:any) : Promise<void> {
    const recvTransport:any = await this.manager.createWebRtcTransport(id);
    if (recvTransport) {
      this.transports.push(recvTransport);
      this.send({
        type: 'dataRecvTransport',
        payload: {
          id: recvTransport.id,
          iceParameters: recvTransport.iceParameters,
          iceCandidates: recvTransport.iceCandidates,
          dtlsParameters: recvTransport.dtlsParameters,
          sctpParameters: recvTransport.sctpParameters,
        }
      });
    }
  }

  async createSendPlainTransport(id:string, payload:any) : Promise<void> {
    const plainTransport:any = await this.manager.createPlainTransport(id, payload);
    if (plainTransport) {
      this.transports.push(plainTransport);
      this.send({
        type: 'sendPlainTransport',
        payload: {
          id: plainTransport.id,
          ip: plainTransport.tuple.localIp,
          port: plainTransport.tuple.localPort,
          rtcpPort: plainTransport.rtcpTuple ? plainTransport.rtcpTuple.localPort : undefined
        }
      });
    }
  }

  async createRecvPlainTransport(id:string, payload:any) : Promise<void> {
    const plainTransport:any = await this.manager.createPlainTransport(id, payload);
    if (plainTransport) {
      this.transports.push(plainTransport);
      this.send({
        type: 'recvPlainTransport',
        payload: {
          id: plainTransport.id,
          ip: plainTransport.tuple.localIp,
          port: plainTransport.tuple.localPort,
          rtcpPort: plainTransport.rtcpTuple ? plainTransport.rtcpTuple.localPort : undefined
        }
      });
    }
  }

  async getProducers(id:string, _:any) : Promise<void> {
    const producers = await this.manager.getProducers(id);
    if (producers) {
      let producerList = [];
      for (const producer of producers) {
        producerList.push({
          id: producer.id,
          kind: producer.kind,
          type: producer.type,
          rtpParameters: producer.rtpParameters,
          appData: producer.appData
        })
      }
      this.send({
        type: 'producerList',
        payload: {
          producers: producerList
        }
      });
    }
  }

  async createProducer(id:string, payload:any) : Promise<void> {
    const producer:any = await this.manager.createProducer(id, payload);
    if (producer) {
      this.send({
        type: 'producer',
        payload: {
          id: producer.id,
          kind: producer.kind,
          type: producer.type,
          rtpParameters: producer.rtpParameters,
          appData: producer.appData
        }
      });
    }
  }

  async createConsumer(id:string, payload:any) : Promise<void> {
    const consumer:any = await this.manager.createConsumer(id, payload);
    if (consumer) {
      this.send({
        type: 'consumer',
        payload: {
          id: consumer.id,
          producerId: id,
          kind: consumer.kind,
          type: consumer.type,
          rtpParameters: consumer.rtpParameters
        }
      });
    }
  }

  async getDataProducers(id:string, _:any) : Promise<void> {
    const dataProducers = await this.manager.getDataProducers(id);
    if (dataProducers) {
      let producerList = [];
      for (const dataProducer of dataProducers) {
        producerList.push({
          id: dataProducer.id,
          type: dataProducer.type,
          sctpStreamParameters: dataProducer.sctpStreamParameters,
          label: dataProducer.label,
          appData: dataProducer.appData
        })
      }
      this.send({
        type: 'dataProducerList',
        payload: {
          dataProducers: producerList
        }
      });
    }
  }

  async createDataProducer(id:string, payload:any) : Promise<void> {
    const dataProducer = await this.manager.createDataProducer(id, payload);
    if (dataProducer) {
      this.send({
        type: 'dataProducer',
        payload: {
          dataProducerId: dataProducer.id,
          type: dataProducer.type,
          sctpStreamParameters: dataProducer.sctpStreamParameters,
          label: dataProducer.label,
          appData: dataProducer.appData
        }
      });
    }
  }

  async createDataConsumer(id:string, payload:any) : Promise<void> {
    const dataConsumer = await this.manager.createDataConsumer(id, payload);
    if (dataConsumer) {
      this.send({
        type: 'dataConsumer',
        payload: {
          id: dataConsumer.id,
          dataProducerId: dataConsumer.dataProducerId,
          type: dataConsumer.type,
          sctpStreamParameters: dataConsumer.sctpStreamParameters,
          label: dataConsumer.label,
          protocol: dataConsumer.protocol,
          appData: dataConsumer.appData
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
