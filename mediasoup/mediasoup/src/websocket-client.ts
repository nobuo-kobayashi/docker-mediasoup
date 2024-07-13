import { WebsocketServer } from "./websocket-server";
import { EventEmitter } from 'events';
import { getLogger } from "log4js";

const logger = getLogger();

export const WSClientEvent = {
  KEY_ON_CLOSE: 'ws-client-close',
  KEY_ON_MESSAGE: 'ws-client-message',
  KEY_ON_ERROR: 'ws-client-error'
}

export class WebsocketClient {
  private id:string;
  private remoteIPAddress:string;
  private ws:any;
  private server:WebsocketServer;
  private emitter:EventEmitter;

  constructor(server:WebsocketServer, id:string, ws:any, remoteIPAddress:string) {
    this.server = server;
    this.emitter = new EventEmitter();
    this.remoteIPAddress = remoteIPAddress;
    this.id = id;
    this.ws = ws;
    this.ws.isAlive = true;
    this.ws.on('message', this.onMessageInternal.bind(this));
    this.ws.on('pong', () => {
      this.ws.isAlive = true;
    });
    this.ws.on('close', this.onDisconnect.bind(this));
    this.ws.on('error', this.onError.bind(this));
  }

  getRemoteIPAddress() {
    return this.remoteIPAddress;
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
      logger.error(`Failed to close a WebsocketClient. id=${this.id}`, e);
    }
  }

  send(message:string) : void {
    try {
      this.ws.send(message);
    } catch (e) {
      logger.error(`Failed to send a message. id=${this.id} message=${message}`, e);
    }
  }

  private onMessageInternal(message:string) : void {
    try {
      this.emitter.emit(WSClientEvent.KEY_ON_MESSAGE, message);
    } catch (e) {
      logger.error(`An error occurred on onMessage. id=${this.id}`, e);
    }
  }

  private onDisconnect() : void {
    this.emitter.emit(WSClientEvent.KEY_ON_CLOSE);
    this.server.onDisconnect(this);
  }

  private onError(error: Error) : void {
    this.emitter.emit(WSClientEvent.KEY_ON_ERROR, error);
    this.server.onError(this, error);
  }
}
