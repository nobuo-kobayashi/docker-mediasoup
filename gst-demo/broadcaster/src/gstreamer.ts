const child = require('child_process');
const treeKill = require('tree-kill');

export interface GStreamerListener {
  onGStreamerStopped() : void;
}

export class Producer {
  transportId:string | undefined;
  producerId:string | undefined;
  ip:string | undefined;
  port:number | undefined;
  rtcpPort:number | undefined; 
  payloadType:number | undefined;
  ssrc:number | undefined;
}

export class GStreamer {
  private subprocess:any;
  private runningFlag:Boolean;
  private listener:GStreamerListener | undefined;
  private videoProducer:Producer;
  private audioProducer:Producer;

  constructor() {
    this.subprocess = undefined;
    this.runningFlag = false;
    this.videoProducer = new Producer();
    this.audioProducer = new Producer();
  }

  setListener(listener:GStreamerListener) : void {
    this.listener = listener;
  }

  getVideoProducer() : Producer {
    return this.videoProducer;
  }

  getAudioProducer() : Producer {
    return this.audioProducer;
  }

  isRunnding() : Boolean {
    return this.runningFlag;
  }

  exec(args:Array<string>) : void {
    if (this.runningFlag) {
      console.warn('subprocess is already running.')
      return;
    }

    console.log("command line: " + args)

    this.runningFlag = true
    this.subprocess = child.spawn('gst-launch-1.0', args, { detached: false });
    this.subprocess.stdout.on('data', (data:any) => {
      console.log('stdout: ' + data.toString());
    });
    this.subprocess.stderr.on('data', (data:any) => {
      console.log('stderr: ' + data.toString());
    });
    this.subprocess.on('error', (error:any) => {
      console.log('err: ' + error.toString());
    })
    this.subprocess.on('close', (code:any) => {
      console.log('close: ' + code);
      this.runningFlag = false;
      this.subprocess = undefined;
      this.listener?.onGStreamerStopped();
    })
  }

  kill() : void {
    if (this.subprocess) {
      try {
        treeKill(this.subprocess.pid, 'SIGKILL')
      } catch (e) {}
      this.subprocess = undefined;
    }
    this.runningFlag = false;
  }

  startVideoOnly() : void {
    const bin = `rtpbin name=rtpbin \
      videotestsrc ! queue \
        ! videoconvert \
        ! vp8enc target-bitrate=1000000 deadline=1 cpu-used=4 \
        ! rtpvp8pay pt=${this.videoProducer.payloadType} ssrc=${this.videoProducer.ssrc} picture-id-mode=2 \
        ! rtpbin.send_rtp_sink_0 \
        rtpbin.send_rtp_src_0 ! udpsink host=${this.videoProducer.ip} port=${this.videoProducer.port} \
        rtpbin.send_rtcp_src_0 ! udpsink host=${this.videoProducer.ip} port=${this.videoProducer.rtcpPort} sync=false async=false \
    `;
    this.exec(bin.split(' ').filter(Boolean));
  }

  start() {
    const bin = `rtpbin name=rtpbin \
      videotestsrc ! queue \
        ! videoconvert \
        ! vp8enc target-bitrate=1000000 deadline=1 cpu-used=4 \
        ! rtpvp8pay pt=${this.videoProducer.payloadType} ssrc=${this.videoProducer.ssrc} picture-id-mode=2 \
        ! rtpbin.send_rtp_sink_0 \
        rtpbin.send_rtp_src_0 ! udpsink host=${this.videoProducer.ip} port=${this.videoProducer.port} \
        rtpbin.send_rtcp_src_0 ! udpsink host=${this.videoProducer.ip} port=${this.videoProducer.rtcpPort} sync=false async=false \
      audiotestsrc ! queue \
        ! audioconvert \
        ! opusenc \
        ! rtpopuspay pt=${this.audioProducer.payloadType} ssrc=${this.audioProducer.ssrc} \
        ! rtpbin.send_rtp_sink_1 \
        rtpbin.send_rtp_src_1 ! udpsink host=${this.audioProducer.ip} port=${this.audioProducer.port} \
        rtpbin.send_rtcp_src_1 ! udpsink host=${this.audioProducer.ip} port=${this.audioProducer.rtcpPort} sync=false async=false
    `;
    this.exec(bin.split(' ').filter(Boolean));
  }
}
