import { WebsocketServer } from "./websocket-server";
import { EventEmitter } from 'events';

export const WSClientEvent = {
  KEY_ON_CLOSE: 'ws-client-close',
  KEY_ON_MESSAGE: 'ws-client-message'
}

export class WebsocketClient {
  private id:string;
  private ws:any;
  private server:WebsocketServer;
  private emitter:EventEmitter;

  constructor(server:WebsocketServer, id:string, ws:any) {
    this.server = server;
    this.emitter = new EventEmitter();
    this.id = id;
    this.ws = ws;
    this.ws.isAlive = true;
    this.ws.on('message', this.onMessageInternal.bind(this));
    this.ws.on('pong', () => {
      this.ws.isAlive = true;
    });
    this.ws.on('close', () => {
      this.emitter.emit(WSClientEvent.KEY_ON_CLOSE);
      this.server.onDisconnect(this);
    });
  }

  getId() : string {
    return this.id;
  }

  on(key:string, callback:any) : void {
    this.emitter.on(key, callback);
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
      this.emitter.emit(WSClientEvent.KEY_ON_MESSAGE, message);
    } catch (e) {
      console.error('An error occurred on onMessage. id=' + this.id, e);
    }
  }
}
