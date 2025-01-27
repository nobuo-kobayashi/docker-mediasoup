<template>
  <v-container>
    <v-row>
      <v-col cols="2">
        <v-text-field label="name" v-model="name" @change="updateField($event)" block></v-text-field>
      </v-col>
      <v-col cols="2">
        <v-btn @click="onCreateProducer" block>
          Producer作成
        </v-btn>
      </v-col>
      <v-col cols="2">
        <v-btn @click="onCreateDataProducer" block>
          DataProducer作成
        </v-btn>
      </v-col>
      <v-col cols="2">
        <v-btn @click="onDestroyProducer" block>
          削除
        </v-btn>
      </v-col>
      <v-col cols="2">
        <v-btn @click="onPauseButton" block>
          Pause
        </v-btn>
      </v-col>
      <v-col cols="2">
        <v-btn @click="onResumeButton" block>
          Resume
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>

</style>

<script lang='ts'>
import { defineComponent, getCurrentInstance } from 'vue';
import { MediasoupProducerParams } from '@/libs/mediasoup-types';

export default defineComponent({
  name: "MediaStreamSender",

  components: {
  },

  data() {
    return {
      name: 'example',
      params: new MediasoupProducerParams('example'),
    }
  },

  setup() {
    const instance = getCurrentInstance();
    const mediasoup = instance?.appContext.config.globalProperties.$mediasoup;
    return {
      mediasoup
    };
  },

  methods: {
    updateField(event:Event) {
      const inputElement = event.target as HTMLInputElement;
      if (inputElement) {
        this.name = inputElement.value;
      }
    },

    async getCameraStream() : Promise<MediaStream> {
      return await navigator.mediaDevices.getUserMedia({video: true, audio: true});
    },

    async getDisplayMediaStream() : Promise<MediaStream> {
      return await navigator.mediaDevices.getDisplayMedia({video: true, audio: false});
    },

    async onCreateProducer() : Promise<void> {
      if (!this.mediasoup.isWSConnected()) {
        console.warn('websocket is not connected.');
        return;
      }

      try {
        // カメラの映像を配信する場合は、こちらを使用します。
        // カメラやディスプレイの取得は https か localhost 以外では使用できないので注意。
        this.params.stream = await this.getCameraStream();
        await this.mediasoup.requestCreateProducer(this.params);
      } catch (e) {
        console.error('', e);
      }
    },

    async onCreateDataProducer() : Promise<void> {
      if (!this.mediasoup.isWSConnected()) {
        console.warn('websocket is not connected.');
        return;
      }
      await this.mediasoup.requestCreateDataProducer(this.params);
    },

    async onDestroyProducer() : Promise<void> {
      if (!this.mediasoup.isWSConnected()) {
        console.warn('websocket is not connected.');
        return;
      }
      this.mediasoup.destroyProducer();
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
})
</script>
