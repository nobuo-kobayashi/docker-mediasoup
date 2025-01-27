<template>
  <v-container>
    <v-row>
      <v-col cols="8">
        <v-row>
          <v-col cols="12">
            配信
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <media-stream-sender></media-stream-sender>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            受信
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="6">
            <media-stream-receiver></media-stream-receiver>
          </v-col>
          <v-col cols="6">
            <media-stream-receiver></media-stream-receiver>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="4">
        <v-row>
          <v-col cols="12">
            データチャンネル
          </v-col>
        </v-row>
        <v-row style="width: 100%;height: 100%;">
          <v-col cols="12" style="width: 100%;height: 100%;">
            <datachannel></datachannel>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang='ts'>
import { defineComponent, getCurrentInstance } from 'vue';
import { DemoEvent } from '@/libs/mediasoup-demo';
import MediaStreamSender from './MediaStreamSender.vue';
import MediaStreamReceiver from './MediaStreamReceiver.vue';
import DataChannel from './DataChannel.vue';

export default defineComponent({
  name: 'MyPage',

  components: {
    'media-stream-sender': MediaStreamSender,
    'media-stream-receiver': MediaStreamReceiver,
    'datachannel': DataChannel
  },

  setup() {
    const instance = getCurrentInstance();
    const mediasoup = instance?.appContext.config.globalProperties.$mediasoup;
    return {
      mediasoup
    };
  },

  mounted() {
    this.mediasoup.on(DemoEvent.KEY_WS_OPEN, this.onWSOpen.bind(this));
    this.mediasoup.on(DemoEvent.KEY_WS_CLOSE, this.onWSClose.bind(this));
  },

  methods: {
    onWSOpen() : void {
      this.mediasoup.requestRtpCapabilities();
      console.log('ws opened');
    },

    onWSClose() : void {
      console.log('ws closed');
    }
  }
});
</script>
