import { WebsocketClient, WSClientEvent } from "./websocket-client";
import { MediasoupManager, DEFAULT_MEDIASOUP_ID } from "./mediasoup-manager";
import { getLogger } from "log4js";
import { Mediasoup } from "./mediasoup";
import { MCError } from "./mediasoup-error";

const defaultLogger = getLogger();
const accessLogger = getLogger('access');

type MediasoupFunction = (id:string, payload:any) => Promise<any>;

export class MediasoupClient {
  private manager:MediasoupManager;
  private client:WebsocketClient;
  private transports:Map<string, any> = new Map();
  private funcMap:Map<string, MediasoupFunction> = new Map();

  constructor(manager:MediasoupManager, client:WebsocketClient) {
    this.manager = manager;
    this.client = client;
    this.client.on(WSClientEvent.KEY_ON_CLOSE, this.onClose.bind(this));
    this.client.on(WSClientEvent.KEY_ON_MESSAGE, this.onMessage.bind(this));

    // リクエスト
    // {
    //   id: 'xxxx',
    //   uuid: 'XXXX'
    //   type: 'XXXX',
    //   payload: {}
    // }

    // レスポンス
    // {
    //   id: 'xxxx',
    //   uuid: 'XXXX'
    //   type: 'XXXX',
    //   payload: {},
    //   error: {
    //     code: 'xxxx',
    //     message: 'XXXX'
    //   }
    // }

    this.funcMap.set('getSessionList', this.getMediaSessionList.bind(this));
    this.funcMap.set('createSession', this.createMediaSession.bind(this));
    this.funcMap.set('destroySession', this.destroyMediaSession.bind(this));
    this.funcMap.set('rtpCapabilities', this.getRtpCapabilities.bind(this));
    this.funcMap.set('createPlainTransport', this.createPlainTransport.bind(this));
    this.funcMap.set('createWebRtcTransport', this.createWebRtcTransport.bind(this));
    this.funcMap.set('destroyPlainTransport', this.destroyPlainTransport.bind(this));
    this.funcMap.set('destroyWebRtcTransport', this.destroyWebRtcTransport.bind(this));
    this.funcMap.set('connect', this.connect.bind(this));
    this.funcMap.set('produce', this.createProducer.bind(this));
    this.funcMap.set('consume', this.createConsumer.bind(this));
    this.funcMap.set('dataProduce', this.createDataProducer.bind(this));
    this.funcMap.set('dataConsume', this.createDataConsumer.bind(this));
    this.funcMap.set('producerList', this.getProducers.bind(this));
    this.funcMap.set('dataProducerList', this.getDataProducers.bind(this));
    this.funcMap.set('pauseProducer', this.pauseProducer.bind(this));
    this.funcMap.set('resumeProducer', this.resumeProducer.bind(this));
  }

  onClose(): void {
    // Websocket の接続が切れたら、mediasoup の設定を削除します。
    const mediasoup = this.manager.getMediasoupById(DEFAULT_MEDIASOUP_ID);
    if (mediasoup) {
      for (const transportId of this.transports.keys()) {
        mediasoup.deleteTransport(transportId);
      }
    }
    this.transports.clear();
  }

  async onMessage(message:string) {
    let json = null;
    try {
      json = JSON.parse(message);
    } catch (e) {
      defaultLogger.error(`Failed to parse a json: ${message}`, e);
      return;
    }

    accessLogger.log(`C[${this.client.getRemoteIPAddress()}] -> S recv: ${message}`);

    const id = json.id || '';
    const uuid = json.uuid || '';
    const type = json.type || '';
    const func = this.funcMap.get(type);
    if (func) {
      try {
        const response = await func(DEFAULT_MEDIASOUP_ID, json.payload);
        response.uuid = uuid;
        this.send(response);
      } catch (error) {
        if (error instanceof MCError) {
          this.sendError(uuid, type, error);
        } else if (error instanceof Error) {
          this.sendError(uuid, type, new MCError('unknown', error.message));
        } else {
          this.sendError(uuid, type, new MCError('unknown', 'unknown'));
        }
        defaultLogger.error(`Error: `, error);
      }
    } else {
      defaultLogger.warn(`Unknown type. type=${type}`);
    }
  }

  send(message:any) {
    if (typeof(message) != 'string') {
      message = JSON.stringify(message);
    }

    accessLogger.log(`S -> C[${this.client.getRemoteIPAddress()}] send: ${message}`);

    this.client.send(message);
  }

  private sendError(uuid:string, type:string, error:MCError) {
    this.send({
      uuid: uuid,
      type: type,
      error: {
        code: error.code,
        message: error.message
      }
    });
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

  private getMediasoupById(id:string) : Mediasoup {
    const mediasoup = this.manager.getMediasoupById(id);
    if (!mediasoup) {
      throw new MCError('0', `Not found a mediasoup. id=${id}`);
    }
    return mediasoup;
  }

  private async getMediaSessionList(_id:string, _payload:any) : Promise<any> {
    const list: any[] = [];
    for (let mediasoup of this.manager.getMediasoupList()) {
      list.push({
        id: mediasoup?.getId(),
        name: mediasoup?.getName()
      });
    }
    return {
      type: 'listSession',
      payload: {
        list: list
      }
    };
  }

  private async createMediaSession(_id:string, payload:any) : Promise<any> {
    const id = this.createRandomString();
    const { name } = payload;
    const mediasoup = await this.manager.createMediasoup(id, name);
    if (!mediasoup) {
      throw new MCError('0', 'Failed to create a Mediasoup.');
    }
    return {
      type: 'createSession',
      payload: {
        id: mediasoup.getId(),
        name: name
      }
    };
  }

  private async destroyMediaSession(id:string, _payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    this.manager.removeMediasoup(id);
    return {
      type: 'destroySession',
      payload: {
        id: mediasoup.getId()
      }
    };
  }

  private async getRtpCapabilities(id:string, _payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    const capabilities:any = mediasoup.getCapabilities();
    return {
      type: 'rtpCapabilities',
      payload: {
        rtpCapabilities: capabilities
      }
    };
  }

  private async createWebRtcTransport(id:string, _payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    const webRtcTransport:any = await mediasoup.createWebRtcTransport();
    if (!webRtcTransport) {
      throw new MCError('0', 'Failed to create a WebRtcTransport.');
    }
    this.transports.set(webRtcTransport.id, webRtcTransport);
    return {
      type: 'createWebRtcTransport',
      payload: {
        id: webRtcTransport.id,
        iceParameters: webRtcTransport.iceParameters,
        iceCandidates: webRtcTransport.iceCandidates,
        dtlsParameters: webRtcTransport.dtlsParameters,
        sctpParameters: webRtcTransport.sctpParameters,
      }
    }
  }

  private async destroyWebRtcTransport(id:string, payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    this.transports.delete(payload.id);
    mediasoup.deleteTransport(payload.id);
    return {
      type: 'destroyWebRtcTransport',
      payload: {}
    }
  }

  private async createPlainTransport(id:string, payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    const plainTransport:any = await mediasoup.createPlainTransport(payload);
    if (!plainTransport) {
      throw new MCError('0', 'Failed to create a PlainTransport.');
    }
    this.transports.set(plainTransport.id, plainTransport);
    return {
      type: 'createPlainTransport',
      payload: {
        id: plainTransport.id,
        ip: plainTransport.tuple.localIp,
        port: plainTransport.tuple.localPort,
        rtcpPort: plainTransport.rtcpTuple ? plainTransport.rtcpTuple.localPort : undefined
      }
    }
  }

  private async destroyPlainTransport(id:string, payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    this.transports.delete(payload.id);
    mediasoup.deleteTransport(payload.id);
    return {
      type: 'destroyPlainTransport',
      payload: {}
    }
  }

  private async connect(id:string, payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    await mediasoup.connect(payload);
    return {
      type: 'connect',
      payload: {}
    };
  }

  private async getProducers(id:string, _payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    const producers = mediasoup.getProducers();
    const producerList = [];
    if (producers) {
      for (const producer of producers) {
        producerList.push({
          id: producer.id,
          kind: producer.kind,
          type: producer.type,
          rtpParameters: producer.rtpParameters,
          appData: producer.appData
        })
      }
    }
    return {
      type: 'producerList',
      payload: {
        producers: producerList
      }
    }
  }

  private async createProducer(id:string, payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    const producer:any = await mediasoup.createProducer(payload);
    if (!producer) {
      throw new MCError('0', 'Failed to create a Producer.');
    }
    return {
      type: 'produce',
      payload: {
        id: producer.id,
        kind: producer.kind,
        type: producer.type,
        rtpParameters: producer.rtpParameters,
        appData: producer.appData
      }
    }
  }

  private async createConsumer(id:string, payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    const consumer:any = await mediasoup.createConsumer(payload);
    if (!consumer) {
      throw new MCError('0', 'Failed to create a Consumer.');
    }
    return {
      type: 'consume',
      payload: {
        id: consumer.id,
        producerId: id,
        kind: consumer.kind,
        type: consumer.type,
        rtpParameters: consumer.rtpParameters
      }
    }
  }

  private async getDataProducers(id:string, _payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    const dataProducers = mediasoup.getDataProducers();
    const producerList = [];
    if (dataProducers) {
      for (const dataProducer of dataProducers) {
        producerList.push({
          id: dataProducer.id,
          type: dataProducer.type,
          sctpStreamParameters: dataProducer.sctpStreamParameters,
          label: dataProducer.label,
          appData: dataProducer.appData
        })
      }
    }
    return {
      type: 'dataProducerList',
      payload: {
        dataProducers: producerList
      }
    }
  }

  private async createDataProducer(id:string, payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    const dataProducer = await mediasoup.createDataProducer(payload);
    if (!dataProducer) {
      throw new MCError('0', 'Failed to create a DataProducer.');
    }
    return {
      type: 'dataProducer',
      payload: {
        dataProducerId: dataProducer.id,
        type: dataProducer.type,
        sctpStreamParameters: dataProducer.sctpStreamParameters,
        label: dataProducer.label,
        appData: dataProducer.appData
      }
    }
  }

  private async createDataConsumer(id:string, payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    const dataConsumer = await mediasoup.createDataConsumer(payload);
    if (!dataConsumer) {
      throw new MCError('0', 'Failed to create a DataConsumer.');
    }
    return {
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
    }
  }

  private async pauseProducer(id:string, payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    mediasoup.pauseProducer(payload.producerId);
    return {
      type: 'pauseProducer',
      payload: {}
    }
  }

  private async resumeProducer(id:string, payload:any) : Promise<any> {
    const mediasoup = this.getMediasoupById(id);
    mediasoup.resumeProducer(payload.producerId);
    return {
      type: 'resumeProducer',
      payload: {}
    }
  }
}
