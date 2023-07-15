import WebSocket from 'ws';

export interface WebsocketClientListener {
  onWSOpen() : void;
  onWSClose() : void;
  onWSError() : void;
  onWSMessage(message:string) : void;
}

export class WebsocketClient {
  private listener:WebsocketClientListener | undefined;
  private websocket:any;
  private retryFlag:boolean;
  private retryInterval:number;

  constructor() {
    this.retryFlag = true;
    this.retryInterval = 3000;
  }

  setListener(listener:WebsocketClientListener) : void {
    this.listener = listener;
  }

  connect(url:string) : void {
    console.log('Websocket is trying to connect....', url);

    if (this.websocket) {
      this.websocket.close();
    }

    // リトライを有効にしておきます。
    this.retryFlag = true;

    this.websocket = new WebSocket(url);
    this.websocket.on('open', () => {
      console.log('Websocket is connected.');
      this.listener?.onWSOpen();
    });
    this.websocket.on('message', (message:string) => {
      this.listener?.onWSMessage(message);
    });
    this.websocket.on('error', () => {
      this.listener?.onWSError();
    });
    this.websocket.on('close', () => {
      this.retryConnect(url);
      this.listener?.onWSClose();
    });
  }

  send(message:any) : void {
    if (typeof(message) != 'string') {
      try {
        message = JSON.stringify(message);
      } catch (e) {
        console.error('Failed to convert object to JSON', e);
      }
    }
    this.websocket.send(message);
  }

  close() : void {
    this.retryFlag = false;
    this.websocket?.close();
    this.websocket = undefined;
  }

  private retryConnect(url:string) : void {
    if (this.retryFlag) {
      setTimeout(() => {
        if (this.retryFlag) {
          this.connect(url);
        }
      }, this.retryInterval);
    }
  }
}
