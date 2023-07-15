import { WebsocketServer } from "./websocket-server";

export interface WebsocketClientLister {
  onClose() : void;
  onMessage(message: string) : void;
}

export class WebsocketClient {
  private id: string;
  private ws: any;
  private server: WebsocketServer;
  private listener: WebsocketClientLister | undefined;

  constructor(server:WebsocketServer, id:string, ws:any) {
    this.server = server;
    this.listener = undefined;
    this.id = id;
    this.ws = ws;
    this.ws.isAlive = true;
    this.ws.on('message', this.onMessageInternal.bind(this));
    this.ws.on('pong', () => {
      this.ws.isAlive = true;
    });
    this.ws.on('close', () => {
      this.listener?.onClose();
      this.server.onDisconnect(this);
    });
  }

  getId() : string {
    return this.id;
  }

  setListener(listener:WebsocketClientLister) : void {
    this.listener = listener;
  }

  close(code:number, reason:string) : void {
    try {
      this.ws.close(code, reason);
    } catch (e) {
      console.error('Failed to close. id=' + this.id, e);
    }
  }

  send(message:string) : void {
    try {
      this.ws.send(message);
    } catch (e) {
      console.error('Failed to send a message. id=' + this.id + ' message=' + message, e);
    }
  }

  onMessageInternal(message:string) : void {
    try {
      this.listener?.onMessage(message);
    } catch (e) {
      console.error('An error occurred on onMessage. id=' + this.id, e);
    }
  }
}
