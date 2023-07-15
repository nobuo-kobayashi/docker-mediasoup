import { MediasoupBroadcaster, MediasoupBroadcasterListener } from "./mediasoup-broadcaster";

class DemoListener implements MediasoupBroadcasterListener {
  onWSOpen() : void {
  }
  onWSClose() : void {
  }
}

function shceme() {
  return process.env.MEDIASOUP_SSL == 'true' ? 'wss' : 'ws';
}

const wsUrl = shceme() + '://' + process.env.MEDIASOUP_IP + ':' + process.env.MEDIASOUP_PORT;
const broadcaster = new MediasoupBroadcaster(wsUrl);
broadcaster.setListener(new DemoListener());
