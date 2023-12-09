<template>
  <v-container>
    <v-row>
      <v-col justify="center" cols="12">
        映像・音声
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="4">
        <v-btn @click="onSendTransport" block>
          Producer作成
        </v-btn>
      </v-col>
      <v-col cols="2">
        <v-btn @click="onUpdateProducerList" block>
          Producer取得
        </v-btn>
        <producer-selection-dialog ref="producerDialog"
          @onSelectProducerId="onSelectProducerId"
        ></producer-selection-dialog>
      </v-col>
      <v-col cols="4">
        <v-text-field label="ProducerId" v-model="producerId" block></v-text-field>
      </v-col>
      <v-col cols="2">
        <v-btn @click="onRecvTransport" block>
          Consumer作成
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col justify="center" cols="3">
        <v-btn @click="onPauseButton" block>
          Pause
        </v-btn>
      </v-col>
      <v-col justify="center" cols="3">
        <v-btn @click="onResumeButton" block>
          Resume
        </v-btn>
      </v-col>
      <v-col justify="center" cols="6">
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col justify="center" cols="6">
        <canvas id="canvas"></canvas>
      </v-col>
      <v-col justify="center" cols="6">
        <video id="video" autoplay playsinline controls muted>
          Your browser does not support video
        </video> 
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col justify="center" cols="12">
        データチャンネル
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="4">
        <v-btn @click="onDataSendTransport" block>
          DataProducer作成
        </v-btn>
      </v-col>
      <v-col cols="2">
        <v-btn @click="onUpdateDataProducerList" block>
          DataProducer取得
        </v-btn>
          <producer-selection-dialog ref="dataProducerDialog"
            @onSelectProducerId="onSelectDataProducerId"
          ></producer-selection-dialog>
      </v-col>
      <v-col cols="4">
        <v-text-field label="DataProducerId" v-model="dataProducerId" block></v-text-field>
      </v-col>
      <v-col cols="2">
        <v-btn @click="onDataRecvTransport" block>
          DataConsumer作成
        </v-btn>
      </v-col>
    </v-row>
    <v-row >
      <v-col cols="4">
        <v-text-field label="送信するメッセージ" v-model="sendText" block></v-text-field>
      </v-col>
      <v-col cols="2">
        <v-btn @click="onSendDataChannel" block>
          送信
        </v-btn>
      </v-col>
      <v-col cols="6">
        <div class="text" v-html="recvText"></div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
video {
  width: 400px;
  height: 300px;
}

canvas {
  width: 400px;
  height: 300px;
}

div.text {
  background-color: lightgray;
  width: 100%;
  height: 100%;
  padding: 8px;
}
</style>

<script lang='ts'>
import { defineComponent } from 'vue'
import { MediasoupDemo, DemoEvent } from '@/libs/mediasoup-demo'
import ProducerSelectionDialog from '@/components/ProducerSelectionDialog.vue'

export default defineComponent({
  name: 'MyPage',

  components: {
    'producer-selection-dialog': ProducerSelectionDialog,
  },

  data() {
    return {
      producerDialogItems: [],
      producerId: '' as string,
      dataProducerId: '' as string,
      sendText: '',
      recvText: ''
    }
  },

  setup() {
    // docker-compose.yml に定義されている MEDIASOUP_IP、MEDIASOUP_PORT
    // に、mediasoup サーバが起動していますので、その URL を指定します。
    const shceme = () => {
      return location.protocol.startsWith('https') ? 'wss' : 'ws';
    }
    const wsUrl = shceme() + '://' + location.hostname + ':3000';
    const mediasoup = new MediasoupDemo(wsUrl);
    return {
      mediasoup
    };
  },

  mounted() {
    this.mediasoup.on(DemoEvent.KEY_WS_OPEN, this.onWSOpen.bind(this));
    this.mediasoup.on(DemoEvent.KEY_WS_CLOSE, this.onWSClose.bind(this));
    this.mediasoup.on(DemoEvent.KEY_ON_PRODUCER_ID, this.onProducerId.bind(this));
    this.mediasoup.on(DemoEvent.KEY_ON_DATA_PRODUCER_ID, this.onDataProducerId.bind(this));
    this.mediasoup.on(DemoEvent.KEY_ON_MESSAGE, this.onDataChannelMessage.bind(this));
    this.mediasoup.on(DemoEvent.KEY_ON_PRODUCER_LIST, this.onProducerList.bind(this));
    this.mediasoup.on(DemoEvent.KEY_ON_DATA_PRODUCER_LIST, this.onDataProducerList.bind(this));
  },

  methods: {
    onWSOpen() : void {
      this.mediasoup.requestRtpCapabilities();
      console.log('ws opened');
    },

    onWSClose() : void {
      console.log('ws closed');
    },

    onProducerId(producerId:string) : void {
      this.producerId = producerId;
    },

    onDataProducerId(dataProducerId:string) : void {
      this.dataProducerId = dataProducerId;
    },

    onDataChannelMessage(message:string) : void {
      this.recvText += message;
      this.recvText += '<br>';
    },

    onProducerList(producerList:any) : void {
      console.log('onProducerList', producerList);
      this.producerDialogItems = producerList;
      (this.$refs.producerDialog as any).open(producerList);
    },

    onDataProducerList(dataProducerList:any) : void {
      console.log('onDataProducerList', dataProducerList);
      (this.$refs.dataProducerDialog as any).open(dataProducerList);
    },

    onUpdateProducerList() : void {
      this.mediasoup.requestGetProducerList();
    },

    onUpdateDataProducerList() : void {
      this.mediasoup.requestGetDataProducerList();
    },

    async onSelectProducerId(response:string) : Promise<void> {
      this.producerId = response;
    },

    async onSelectDataProducerId(response:string) : Promise<void> {
      this.dataProducerId = response;
    },

    async onSendTransport() : Promise<void> {
      if (!this.mediasoup.isWSConnected()) {
        console.warn('websocket is not connected.');
        return;
      }
      // カメラの映像を配信する場合は、こちらを使用します。
      // カメラやディスプレイの取得は https か localhost 以外では使用できないので注意。
      this.mediasoup.setMediaStream(await this.getCameraStream());
      // this.mediasoup.setMediaStream(this.getCanvasStream());
      this.mediasoup.requestCreateProducer();
    },

    async onRecvTransport() : Promise<void> {
      if (!this.mediasoup.isWSConnected()) {
        console.warn('websocket is not connected.');
        return;
      }
      if (!this.producerId) {
        console.warn('this.producerId is not set.');
        return;
      }
      this.mediasoup.setProducerId(this.producerId);
      this.mediasoup.setRemoteVideo(this.getVideoElement());
      this.mediasoup.requestCreateConsumer();
    },
    
    async onDataSendTransport() : Promise<void> {
      if (!this.mediasoup.isWSConnected()) {
        console.warn('websocket is not connected.');
        return;
      }
      this.mediasoup.requestCreateDataProducer();
    },

    async onDataRecvTransport() : Promise<void> {
      if (!this.mediasoup.isWSConnected()) {
        console.warn('websocket is not connected.');
        return;
      }
      if (!this.dataProducerId) {
        console.warn('this.dataProducerId is not set.');
        return;
      }
      this.mediasoup.setDataProducerId(this.dataProducerId);
      this.mediasoup.requestCreateDataConsumer();
    },

    onSendDataChannel() : void {
      if (!this.mediasoup.isWSConnected()) {
        console.warn('websocket is not connected.');
        return;
      }
      if (!this.sendText) {
        return;
      }
      this.mediasoup.sendMessage(this.sendText);
    },

    async getCameraStream() : Promise<MediaStream> {
      // let cameraStream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: false});
      let cameraStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
      return cameraStream;
    },

    getCanvasStream() : MediaStream {
      let canvas:HTMLCanvasElement = this.startRenderingCanvas();
      let canvasStream:MediaStream = canvas.captureStream(30);
      return canvasStream;
    },

    startRenderingCanvas() : HTMLCanvasElement {
      let element = document.getElementById('canvas');
      let canvas:HTMLCanvasElement = element! as HTMLCanvasElement;
      let ctx:CanvasRenderingContext2D = canvas.getContext('2d')!;
      function _canvasUpdate() {
        ctx.fillStyle = '#FFFFFF';
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = '16px serif';
        ctx.fillText('' + new Date(), 5, 50);
        requestAnimationFrame(_canvasUpdate);
      }
      _canvasUpdate();
      return canvas;
    },

    getVideoElement() : HTMLVideoElement {
      let element = document.getElementById('video');
      let video:HTMLVideoElement = element! as HTMLVideoElement;
      return video;
    },

    onPauseButton() : void {
      if (this.mediasoup) {
        this.mediasoup.pauseProducer();
      }
    },

    onResumeButton() : void {
      if (this.mediasoup) {
        this.mediasoup.resumeProducer();
      }
    }
  }
});
</script>
