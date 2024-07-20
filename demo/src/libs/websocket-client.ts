import { EventEmitter } from 'events';

/**
 * Websocket が接続されているステートを定義します。
 * 
 * @private
 */
const WS_OPEN_STATE = 1;

export const WSEvent = {
  KEY_WS_OPENED: 'wsopened',
  KEY_WS_CLOSED: 'wsclosed',
  KEY_WS_ERROR: 'wserror',
  KEY_WS_MESSAGE: 'wsmessage',
  KEY_RTP_CAPABILITIES: 'rtpCapabilities',
  KEY_SEND_TRANSPORT: 'sendTransport',
  KEY_RECV_TRANSPORT: 'recvTransport',
  KEY_PRODUCER: 'producer',
  KEY_CONSUMER: 'consumer',
  KEY_DATA_SEND_TRANSPORT: 'dataSendTransport',
  KEY_DATA_RECV_TRANSPORT: 'dataRecvTransport',
  KEY_DATA_PRODUCER: 'dataProducer',
  KEY_DATA_CONSUMER: 'dataConsumer',
  KEY_PRODUCER_LIST: 'producerList',
  KEY_DATA_PRODUCER_LIST: 'dataProducerList'
}

export class WebsocketClient {
  private ws?:WebSocket;
  private url:string;
  private closeFlag:boolean;
  private emitter:EventEmitter;

  constructor(url:string) {
    this.url = url;
    this.ws = undefined;
    this.closeFlag = false;
    this.emitter = new EventEmitter();
  }

  on(key:string, callback:any) {
    this.emitter.on(key, callback);
  }

  connect() {
    if (this.isConnected()) {
      // 既に接続されている場合は何もしません。
      console.warn('Websocket has already connected.');
      return true;
    }

    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      // 既に close されている場合には、再度 close を呼び出します。
      if (this.closeFlag) {
        this.close();
        return;
      }
      this.emitter.emit(WSEvent.KEY_WS_OPENED);
    };

    this.ws.onmessage = (event:MessageEvent) => {
      this.emitter.emit(WSEvent.KEY_WS_MESSAGE, event.data);
    };

    this.ws.onerror = (event:Event) => {
      this.emitter.emit(WSEvent.KEY_WS_ERROR, event);
    };

    this.ws.onclose = () => {
      this.emitter.emit(WSEvent.KEY_WS_CLOSED);
      this.ws = undefined;
    };

    return true;
  }

  isConnected() {
    return this.ws && this.ws.readyState === WS_OPEN_STATE;
  }

  send(msg:string|object) {
    if (typeof(msg) !== 'string') {
      msg = JSON.stringify(msg);
    }

    if (this.ws && this.isConnected()) {
      this.ws.send(msg);
    } else {
      console.warn('Websocket is not connect.');
    }
  }

  close(code = undefined) {
    this.closeFlag = true;

    // websocket に接続される前に close が要求された場合には
    // this.closeFlag を true にして、Websocket::onOpen 
    // のイベントで websocket を close するようにします。
    if (this.ws && this.ws.readyState === WS_OPEN_STATE) {
      this.ws.close(code);
      this.ws = undefined;
    }
  }
}
