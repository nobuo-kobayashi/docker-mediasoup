<template>
  <v-container>
    <v-row justify="center">
      <v-col justify="center" cols="12">
        <video class="video" ref="videoElement" autoplay playsinline controls muted>
          Your browser does not support video
        </video> 
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="4">
        <v-btn @click="onUpdateProducerList" block style="height: 56px;">
          Producer取得
        </v-btn>
        <producer-selection-dialog ref="producerDialog"
          @onSelectProducerId="onSelectProducerId"
        ></producer-selection-dialog>
      </v-col>
      <v-col cols="2">
        <v-btn @click="onCreateConsumer" block style="height: 56px;">
          作成
        </v-btn>
      </v-col>
      <v-col cols="2">
        <v-btn @click="onDestroyConsumer" block style="height: 56px;">
          削除
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="4">
        <v-btn @click="onUpdateDataProducerList" block style="height: 56px;">
          DataProducer取得
        </v-btn>
          <producer-selection-dialog ref="dataProducerDialog"
            @onSelectProducerId="onSelectDataProducerId"
          ></producer-selection-dialog>
      </v-col>
      <v-col cols="4">
        <v-text-field label="DataProducerId" v-model="dataProducerId" block></v-text-field>
      </v-col>
      <v-col cols="4">
        <v-btn @click="onCreateDataConsumer" block style="height: 56px;">
          DataConsumer作成
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>

video {
  width: 320px;
  height: 180px;
}

</style>

<script lang='ts'>
import { defineComponent, getCurrentInstance, onMounted, ref } from 'vue';
import ProducerSelectionDialog from '@/components/ProducerSelectionDialog.vue'
import { MediasoupConsumerParams } from '@/libs/mediasoup-types';

export default defineComponent({
  name: "MediaStreamReceiver",

  components: {
    'producer-selection-dialog': ProducerSelectionDialog,
  },

  data() {
    return {
      params: undefined as MediasoupConsumerParams | undefined,
      dataProducerId: '' as string,
      consumerId: '' as string,
      dataConsumerId: '' as string
    }
  },

  setup() {
    const videoElement = ref<HTMLVideoElement | undefined>(undefined);

    onMounted(() => {
      if (videoElement.value) {
        console.log('Video element:', videoElement.value);
      }
    });

    const instance = getCurrentInstance();
    const mediasoup = instance?.appContext.config.globalProperties.$mediasoup;
    return {
      mediasoup, videoElement
    };
  },

  emits: [
    'onDataChannel'
  ],

  methods: {
    async onUpdateProducerList() : Promise<void> {
      const producerList = await this.mediasoup.requestGetProducerList();
      (this.$refs.producerDialog as any).open(producerList);
    },

    async onUpdateDataProducerList() : Promise<void> {
      const dataProducerList = await this.mediasoup.requestGetDataProducerList();
      (this.$refs.dataProducerDialog as any).open(dataProducerList);
    },

    async onSelectProducerId(params:MediasoupConsumerParams) : Promise<void> {
      this.params = params;
      this.params.remoteVideo = this.videoElement;
    },

    async onSelectDataProducerId(response:string) : Promise<void> {
      this.dataProducerId = response;
    },

    async onCreateConsumer() : Promise<void> {
      if (!this.mediasoup.isWSConnected()) {
        console.warn('websocket is not connected.');
        return;
      }

      this.consumerId = await this.mediasoup.requestCreateConsumer(this.params);
    },

    async onDestroyConsumer() : Promise<void> {
      await this.mediasoup.destroyConsumer(this.consumerId);
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

    async onDestroyDataConsumer() : Promise<void> {
      await this.mediasoup.destroyDataConsumer(this.dataConsumerId);
    }
  }
})
</script>
