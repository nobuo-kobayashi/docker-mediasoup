<template>
  <v-dialog v-model="dialog" max-width="auto" persistent>
    <v-card>
      <v-card-title class="headline">Producer 一覧</v-card-title>
      <v-card-text>
        <v-list v-for="[key, value] in Array.from(map)" :key="key">
          <v-list-item :value="key" @click="onSelectProducerId(value)" >
            <v-list-item-title>{{ value.name }}</v-list-item-title>
            <v-list-item-subtitle v-for="(item, index) in value.producerIds" :key="index">{{ item }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <!-- <v-list v-for="(item, index) in dialogItems" :key="index">
          <v-list-item :value="item" @click="onSelectProducerId(item)" >
            <v-list-item-title>{{ item.id }}</v-list-item-title>
            <v-list-item-subtitle>{{ item.kind }}</v-list-item-subtitle>
            <v-list-item-subtitle>{{ item.appData?.name }}</v-list-item-subtitle>
          </v-list-item>
        </v-list> -->
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text @click="dialog=false">
          キャンセル
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang='ts'>
import { defineComponent, getCurrentInstance } from 'vue';
import { MediasoupConsumerParams } from '@/libs/mediasoup-types';

export default defineComponent({
  name: "ProducerSelectionDialog",

  data() {
    return {
      producerId: [] as Array<string>,
      dataProducerId: '' as string,
      dialog: false,
      dialogItems: [],
      map: new Map<string, MediasoupConsumerParams>(),
    }
  },

  setup() {
    const instance = getCurrentInstance();
    const mediasoup = instance?.appContext.config.globalProperties.$mediasoup;
    return {
      mediasoup
    };
  },

  emits: [ 'onSelectProducerId' ],

  methods: {
    async open(items:[]) : Promise<void> {
      await this.test();
      this.dialogItems = items;
      this.dialog = true;
    },

    async test() :Promise<void> {
      const producerList = await this.mediasoup.requestGetProducerList();
      const dataProducerList = await this.mediasoup.requestGetDataProducerList();

      const map = new Map<string, MediasoupConsumerParams>();
      for (let producer of producerList) {
        const name = producer.appData?.name;
        const id = producer.appData?.id;
        let data = map.get(id);
        if (!data) {
          data = new MediasoupConsumerParams(id, name);
          map.set(id, data);
        }
        data.producerIds.push(producer.id);
      }

      for (let dataProducer of dataProducerList) {
        const name = dataProducer.appData?.name;
        const id = dataProducer.appData?.id;
        let data  = map.get(id);
        if (!data) {
          data = new MediasoupConsumerParams(id, name);
          map.set(id, data);
        }
        data.dataProducerId = dataProducer.id;
      }

      this.map = map;
    },

    onSelectProducerId(arg:MediasoupConsumerParams) {
      this.dialog = false;
      this.$emit('onSelectProducerId', arg);

      // const name = arg.appData?.name;

      // let test = []
      // if (name) {
      //   for (let item of this.dialogItems) {
      //     if ((item as any).appData?.name === name) {
      //       test.push((item as any).id);
      //     }
      //   }
      // }

      // this.dialog = false;
      // this.$emit('onSelectProducerId', test);
    }
  }
});
</script>
