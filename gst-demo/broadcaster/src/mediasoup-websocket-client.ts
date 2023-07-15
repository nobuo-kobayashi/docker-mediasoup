import { WebsocketClient, WebsocketClientListener } from "./websocket-client";


export interface MediasoupWebsocketClientListener {
  onWSOpen() : void;
  onWSClose() : void;
  onWSError() : void;
  onMediasoupSendPlainTransport(payload:any) : void;
  onMediasoupProducer(payload:any) : void;
}

export class MediasoupWebsocketClient implements WebsocketClientListener {
  private websocket:WebsocketClient | undefined;
  private listener:MediasoupWebsocketClientListener | undefined;

  constructor() {
  }

  setListener(listener:MediasoupWebsocketClientListener) : void {
    this.listener = listener;
  }

  connect(url:string) {
    if (this.websocket) {
      this.websocket?.close();
    }
    this.websocket = new WebsocketClient();
    this.websocket.setListener(this);
    this.websocket.connect(url);
  }

  disconnect() {
    this.websocket?.close();
    this.websocket = undefined;
  }

  send(message:any) {
    console.log('## SEND: ', message);
    this.websocket?.send(message);
  }

  // ===============================================================================
  // WebsocketClientListener
  // ===============================================================================

  onWSOpen() : void {
    this.listener?.onWSOpen();
  }

  onWSClose() : void {
    this.listener?.onWSClose();
  }

  onWSError() : void {
    this.listener?.onWSError();
  }

  onWSMessage(message:string) : void {
    let json = null;
    try {
      json = JSON.parse(message);
    } catch (e) {
      console.error('Failed to parse a json: ' + message, e);
      return;
    }

    console.log('@@ RECV: ' + message);

    switch (json.type) {
      case 'sendPlainTransport':
        this.listener?.onMediasoupSendPlainTransport(json.payload);
        break;
      case 'producer':
        this.listener?.onMediasoupProducer(json.payload);
        break;
      default:
        break;
    }
  }

  // ===============================================================================
  // public
  // ===============================================================================

  requestPlainRtpTransport() : void {
    this.send({
      'type': 'createSendPlainTransport',
      'payload': {
        'rtcpMux' : false,
        'comedia' : true
      }
    });
  }

  requestCreateProducer(id:string, kind:string, rtpParameters:any) {
    this.send({
      'type': 'produce',
      'payload': {
        'id': id,
        'parameters': {
          'kind': kind,
          'rtpParameters': rtpParameters
        }
      }
    });
  }
}
