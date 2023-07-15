import { MediasoupWebsocketClient, MediasoupWebsocketClientListener } from "./mediasoup-websocket-client";
import { GStreamer, GStreamerListener, Producer } from "./gstreamer";

const AUDIO_SSRC = 1111;
const AUDIO_PT = 100;
const VIDEO_SSRC = 2222;
const VIDEO_PT = 101;

const STATE_AUDIO = 0;
const STATE_VIDEO = 1;

export interface MediasoupBroadcasterListener {
  onWSOpen() : void;
  onWSClose() : void;
}

export class MediasoupBroadcaster implements MediasoupWebsocketClientListener, GStreamerListener {
  private websocket:MediasoupWebsocketClient;
  private listener:MediasoupBroadcasterListener | undefined;
  private gstreamer:GStreamer;
  private state:number;

  constructor(url:string) {
    this.websocket = new MediasoupWebsocketClient();
    this.websocket.setListener(this);
    this.websocket.connect(url);
    this.gstreamer = new GStreamer();
    this.gstreamer.setListener(this);
    this.state = STATE_AUDIO;
  }

  // ===============================================================================
  // WebsocketClientListener
  // ===============================================================================

  onWSOpen() : void {
    this.listener?.onWSOpen();
    this.state = STATE_AUDIO;
    this.websocket.requestPlainRtpTransport();
  }

  onWSClose() : void {
    this.gstreamer.kill();
    this.listener?.onWSClose();
  }

  onWSError() : void {
  }

  onMediasoupSendPlainTransport(payload:any) : void {
    console.log('@@ onMediasoupSendPlainTransport', payload);
    switch (this.state) {
      case STATE_AUDIO:
        this.createAudioProducer(payload);
        break;
      case STATE_VIDEO:
        this.createVideoProducer(payload);
        break;
    }
  }

  onMediasoupProducer(payload:any) : void {
    console.log('@@ onMediasoupProducer', payload);
    switch (this.state) {
      case STATE_AUDIO:
        this.setProducerId(this.gstreamer.getAudioProducer(), payload);
        this.websocket.requestPlainRtpTransport();
        this.state = STATE_VIDEO;
        break;
      case STATE_VIDEO:
        this.setProducerId(this.gstreamer.getVideoProducer(), payload);
        this.startGStreamer();
        break;
    }
  }

  // ===============================================================================
  // GStreamerListener
  // ===============================================================================

  onGStreamerStopped(): void {
    console.log('gstreamer stopped.');
  }

  // ===============================================================================
  // public
  // ===============================================================================

  setListener(listener: MediasoupBroadcasterListener) : void {
    this.listener = listener;
  }

  createVideoProducer(payload:any) : void {
    const { id, ip, port, rtcpPort } = payload;
    const rtpParameters = {
      'codecs': [
        { 
          'mimeType': 'video/vp8',
          'payloadType': VIDEO_PT,
          'clockRate': 90000
        }
      ], 
      'encodings': [
        { 
          'ssrc': VIDEO_SSRC
        }
      ]
    };
    this.websocket.requestCreateProducer(id, 'video', rtpParameters);

    // GStreamer に映像の設定を行う
    let videoProducer = this.gstreamer.getVideoProducer();
    videoProducer.payloadType = VIDEO_PT;
    videoProducer.ssrc = VIDEO_SSRC;
    videoProducer.transportId = id;
    videoProducer.ip = ip;
    videoProducer.port = port;
    videoProducer.rtcpPort = rtcpPort;
  }

  createAudioProducer(payload:any) : void {
    const { id, ip, port, rtcpPort } = payload;
    const rtpParameters = { 
      'codecs': [
        {
          'mimeType': 'audio/opus', 
          'payloadType': AUDIO_PT, 
          'clockRate': 48000, 
          'channels': 2, 
          'parameters': {
            'sprop-stereo': 1
          }
        }
      ], 
      'encodings': [
        {
          'ssrc': AUDIO_SSRC
        }
      ]
    };
    this.websocket.requestCreateProducer(id, 'audio', rtpParameters);

    // GStreamer に音声の設定を行う
    let audioProducer = this.gstreamer.getAudioProducer();
    audioProducer.payloadType = AUDIO_PT;
    audioProducer.ssrc = AUDIO_SSRC;
    audioProducer.transportId = id;
    audioProducer.ip = ip;
    audioProducer.port = port;
    audioProducer.rtcpPort = rtcpPort;
  }

  setProducerId(producer:Producer, payload:any) : void {
    producer.producerId = payload.producerId;
  }

  startGStreamer() : void {
    this.gstreamer.start();
  }
}
