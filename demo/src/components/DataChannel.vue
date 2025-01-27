<template>
  <v-container class="fill-height">
    <v-row class="fill">
      <v-col cols="12">
        <div class="text" v-html="recvText"></div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-text-field label="送信するメッセージ" v-model="sendText" block>
          <template v-slot:append>
            <v-btn @click="onSendDataChannel">
              送信
            </v-btn>
          </template>
        </v-text-field>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>

.fill {
  width: 100%;
  height: 100%;
}

.fill-height {
  width: 100%;
  height: 100vh;
}

div.text {
  background-color: lightgray;
  width: 100%;
  height: 100%;
  padding: 8px;
  overflow-y: auto;
}
</style>

<script lang='ts'>
import { defineComponent, getCurrentInstance } from 'vue';
import { DemoEvent } from '@/libs/mediasoup-demo';

export default defineComponent({
  name: "DataChannel",

  data() {
    return {
      sendText: '',
      recvText: ''
    }
  },

  mounted() {
    this.mediasoup.on(DemoEvent.KEY_ON_MESSAGE, this.onDataChannelMessage.bind(this));
  },

  setup() {
    const instance = getCurrentInstance();
    const mediasoup = instance?.appContext.config.globalProperties.$mediasoup;
    return {
      mediasoup
    };
  },

  emits: [
    'onDataChannel'
  ],

  methods: {
    onDataChannelMessage(message:string) : void {
      this.recvText += message;
      this.recvText += '<br>';
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
  }
})
</script>
