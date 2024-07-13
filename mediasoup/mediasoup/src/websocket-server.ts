import express from 'express';
import expressWs from 'express-ws';
import { WebsocketClient } from './websocket-client';
import { EventEmitter } from 'events';
import { getLogger } from 'log4js';

const logger = getLogger();
const accessLogger = getLogger('access');

export const WSEvent = {
  KEY_WS_CONNECTED: 'ws-connected',
  KEY_WS_DISCONNECTED: 'ws-disconnected'
}

export class WebsocketServer {
  private wss:any;
  private clients:Map<string, WebsocketClient>;
  private keepAliveInterval:any;
  private count:number;
  private emitter:EventEmitter;

  constructor(expressApp:express.Express, server:any, options:any) {
    this.clients = new Map();
    this.emitter = new EventEmitter();
    this.wss = expressWs(expressApp, server, options);
    this.wss.app.ws('/', this.onConnect.bind(this));
    this.count = 0;
  }

  on(key:string, callback:any) : void {
    this.emitter.on(key, callback);
  }

  shutdown() {
    this.stopKeepAlive();

    for (let client of this.clients.values()) {
      client.close(0, 'shutdown');
    }
    this.clients.clear();
  }

  sendMessageToClient(id:string, message:string) : void {
    const client = this.getClientById(id);
    if (client == undefined) {
      logger.warn(`Not found a websocket client. id=${id}`);
    } else {
      client.send(message);
    }
  }

  sendMessageToAnthorThan(id:string, message:string) : void {
    this.clients.forEach((client, _id) => {
      if (_id != id) {
        client.send(message);
      }
    });
  }

  sendMessageToAllClient(message:string) : void {
    for (let client of this.clients.values()) {
      client.send(message);
    }
  }

  getClientById(id:string) : WebsocketClient | undefined {
    return this.clients.get(id);
  }

  startKeepAlive(interval:number = 30000) : void {
    this.keepAliveInterval = setInterval(() => {
      this.wss.getWss().clients.forEach((ws: any) => {
        if (!ws.isAlive) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, interval);
  }

  stopKeepAlive() : void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  //

  onConnect(ws:any, request:express.Request) : void {
    const remoteIPAddress = this.getRemoteIPAddress(request);
    const clientId = 'client_id_' + (this.count++);
    const client = new WebsocketClient(this, clientId, ws, remoteIPAddress);
    this.clients.set(clientId, client);
    try {
      accessLogger.log(`WebSocket[${clientId}] connected. remoteIPAddress=${remoteIPAddress}`);
      this.emitter.emit(WSEvent.KEY_WS_CONNECTED, client);
    } catch (e) {
      logger.error('An error has occurred on onConnected.', e);
    }
  }

  onDisconnect(client:WebsocketClient) : void {
    const clientId = client.getId();
    try {
      accessLogger.log(`WebSocket[${clientId}] disconnected. remoteIPAddress=${client.getRemoteIPAddress()}`);
      this.clients.delete(clientId);
    } catch (e) {
      logger.error(`Failed to delete a client. clientId=${clientId}`, e);
    } finally {
      try {
        this.emitter.emit(WSEvent.KEY_WS_DISCONNECTED, client);
      } catch (e) {
        logger.error('An error has occurred on onDisconnected.', e);
      }
    }
  }

  onError(client:WebsocketClient, error:Error) : void {
    logger.error(`WebSocket[${client.getId()}] error occurred:`, error);
  }

  private getRemoteIPAddress(request:express.Request): string {
    const remoteAddress = request.ip;
    if (remoteAddress) {
      return remoteAddress;
    }
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (typeof xForwardedFor === 'string') {
      return xForwardedFor.split(',')[0].trim();
    }
    return request.connection.remoteAddress || '';
  }
}
