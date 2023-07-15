/**
 * Websocket が接続されているステートを定義します。
 * 
 * @private
 */
const WS_OPEN_STATE = 1;

export interface WebsocketClientListener {
  onWSOpen() : void;
  onWSError(event:Event) : void;
  onWSClose() : void;
  onMediasoupRtpCapabilities(payload:any) : void;
  onMediasoupSendTransport(payload:any) : void;
  onMediasoupRecvTransport(payload:any) : void;
  onMediasoupProducer(payload:any) : void;
  onMediasoupConsumer(payload:any) : void;
  onMediasoupDataSendTransport(payload:any) : void;
  onMediasoupDataRecvTransport(payload:any) : void;
  onMediasoupDataProducer(payload:any) : void;
  onMediasoupDataConsumer(payload:any) : void;
  onMediasoupProducerList(payload:any) : void;
  onMediasoupDataProducerList(payload:any) : void;
}

export class WebsocketClient {
  private ws:WebSocket | undefined;
  private url:string;
  private closeFlag:boolean;
  private listener:WebsocketClientListener | undefined;;

  constructor (url:string) {
    this.url = url;
    this.ws = undefined;
    this.closeFlag = false;
    this.listener = undefined;
  }

  setListener(listener:WebsocketClientListener) : void {
    this.listener = listener;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      // 既に close されている場合には、再度 close を呼び出します。
      if (this.closeFlag) {
        this.close();
        return;
      }
      this.listener?.onWSOpen();
    };

    this.ws.onmessage = (event:MessageEvent) => {
      let json = null;
      try {
        json = JSON.parse(event.data);
      } catch (e) {
        console.error('error: ' + event.data, e);
        return;
      }

      console.log('@@ this.ws.onmessage', json);

      switch (json.type) { 
        case 'rtpCapabilities':
          this.listener?.onMediasoupRtpCapabilities(json.payload);
          break;
        case 'sendTransport':
          this.listener?.onMediasoupSendTransport(json.payload);
          break;
        case 'recvTransport':
          this.listener?.onMediasoupRecvTransport(json.payload);
          break;
        case 'producer':
          this.listener?.onMediasoupProducer(json.payload);
          break;
        case 'consumer':
          this.listener?.onMediasoupConsumer(json.payload);
          break;
        case 'dataSendTransport':
          this.listener?.onMediasoupDataSendTransport(json.payload);
          break;
        case 'dataRecvTransport':
          this.listener?.onMediasoupDataRecvTransport(json.payload);
          break;
        case 'dataProducer':
          this.listener?.onMediasoupDataProducer(json.payload);
          break;
        case 'dataConsumer':
          this.listener?.onMediasoupDataConsumer(json.payload);
          break;
        case 'producerList':
          this.listener?.onMediasoupProducerList(json.payload);
          break;
        case 'dataProducerList':
          this.listener?.onMediasoupDataProducerList(json.payload);
          break;
        default:
          break;
      }
    };

    this.ws.onerror = (event:Event) => {
      this.listener?.onWSError(event);
    };

    this.ws.onclose = () => {
      this.listener?.onWSClose();
      this.ws = undefined;
    };

    return true;
  }

  isConnected() {
    return this.ws && this.ws.readyState === WS_OPEN_STATE;
  }

  send(msg:string) {
    if (this.ws && this.isConnected()) {
      this.ws.send(msg);
    } else {
      console.warn('Websocket is not connect.');
    }
  }

  close(code = undefined) {
    this.listener = undefined;
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
