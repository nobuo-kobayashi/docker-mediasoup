import { WebsocketServer, WebsocketServerListener } from "./websocket-server";
import { WebsocketClient } from "./websocket-client";
import { MediasoupClient } from "./mediasoup-client";
import { MediasoupManager } from "./mediasoup-manager";

export class MediasoupServer implements WebsocketServerListener {
  private websocketServer: WebsocketServer;
  private websocketClients: Map<string, MediasoupClient>;
  private manager: MediasoupManager

  constructor(app:any, server:any, serverOptions:any) {
    this.websocketServer = new WebsocketServer(app, server, serverOptions);
    this.websocketServer.setListener(this);
    this.websocketClients = new Map();
    this.manager = new MediasoupManager();
  }

  onConnected(client:WebsocketClient) : void {
    let mediasoupClient = new MediasoupClient(this.manager, client);
    this.websocketClients.set(client.getId(), mediasoupClient);
  }

  onDisconnected(client:WebsocketClient) : void {
    try {
      this.websocketClients.delete(client.getId());
    } catch (e) {
      console.error('Failed to delete a WebsocketClient.', e);
    }
  }
}
