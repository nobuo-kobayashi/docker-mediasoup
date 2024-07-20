<template>
  <v-container>
    <v-row>
      <v-col justify="center" cols="12">
        映像・音声
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="4">
        <v-btn @click="onCreateProducer" block>
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
        <v-btn @click="onCreateConsumer" block>
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
        <v-btn @click="onCreateDataProducer" block>
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
        <v-btn @click="onCreateDataConsumer" block>
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
    this.mediasoup.on(DemoEvent.KEY_ON_MESSAGE, this.onDataChannelMessage.bind(this));
  },

  methods: {
    onWSOpen() : void {
      this.mediasoup.requestRtpCapabilities();
      console.log('ws opened');
    },

    onWSClose() : void {
      console.log('ws closed');
    },

    onDataChannelMessage(message:string) : void {
      this.recvText += message;
      this.recvText += '<br>';
    },

    async onUpdateProducerList() : Promise<void> {
      this.producerDialogItems = await this.mediasoup.requestGetProducerList();
      (this.$refs.producerDialog as any).open(this.producerDialogItems);
    },

    async onUpdateDataProducerList() : Promise<void> {
      const dataProducerList = await this.mediasoup.requestGetDataProducerList();
      (this.$refs.dataProducerDialog as any).open(dataProducerList);
    },

    async onSelectProducerId(response:string) : Promise<void> {
      this.producerId = response;
    },

    async onSelectDataProducerId(response:string) : Promise<void> {
      this.dataProducerId = response;
    },

    async onCreateProducer() : Promise<void> {
      if (!this.mediasoup.isWSConnected()) {
        console.warn('websocket is not connected.');
        return;
      }
      // カメラの映像を配信する場合は、こちらを使用します。
      // カメラやディスプレイの取得は https か localhost 以外では使用できないので注意。
      this.mediasoup.requestCreateProducer(await this.getCameraStream());
    },

    async onCreateConsumer() : Promise<void> {
      if (!this.mediasoup.isWSConnected()) {
        console.warn('websocket is not connected.');
        return;
      }
      if (!this.producerId) {
        console.warn('this.producerId is not set.');
        return;
      }
      this.mediasoup.requestCreateConsumer(this.producerId, this.getVideoElement());
    },
    
    async onCreateDataProducer() : Promise<void> {
      if (!this.mediasoup.isWSConnected()) {
        console.warn('websocket is not connected.');
        return;
      }
      this.mediasoup.requestCreateDataProducer();
    },

    async onCreateDataConsumer() : Promise<void> {
      if (!this.mediasoup.isWSConnected()) {
        console.warn('websocket is not connected.');
        return;
      }
      if (!this.dataProducerId) {
        console.warn('this.dataProducerId is not set.');
        return;
      }
      this.mediasoup.requestCreateDataConsumer(this.dataProducerId);
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
      const mediaStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
      return mediaStream;
    },

    async getDisplayMediaStream() : Promise<MediaStream> {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: false});
      return mediaStream;
    },

    getCanvasStream() : MediaStream {
      const canvas:HTMLCanvasElement = this.startRenderingCanvas();
      const canvasStream:MediaStream = canvas.captureStream(30);
      return canvasStream;
    },

    startRenderingCanvas() : HTMLCanvasElement {
      const element = document.getElementById('canvas');
      const canvas:HTMLCanvasElement = element! as HTMLCanvasElement;
      const ctx:CanvasRenderingContext2D = canvas.getContext('2d')!;
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
      const element = document.getElementById('video');
      const video:HTMLVideoElement = element! as HTMLVideoElement;
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
