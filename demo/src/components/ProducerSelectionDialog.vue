<template>
  <v-dialog v-model="dialog" max-width="auto" persistent>
    <v-card>
      <v-card-title class="headline">Producer 一覧</v-card-title>

      <v-card-text>
        <v-list @click:select="onSelectProducerId" v-for="(item, index) in dialogItems" :key="index">
          <v-list-item :value="item.id">
            <v-list-item-title>{{ item.id }}</v-list-item-title>
            <v-list-item-subtitle>{{ item.kind }}</v-list-item-subtitle>
            <v-list-item-subtitle>{{ item.appData?.name }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
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
import { defineComponent } from 'vue';

export default defineComponent({
  name: "ProducerSelectionDialog",

  data() {
    return {
      dialog: false,
      dialogItems: [],
    }
  },

  emits: [ 'onSelectProducerId' ],

  methods: {
    open(items:[]) {
      this.dialogItems = items;
      this.dialog = true;
    },

    onSelectProducerId(arg:any) {
      this.dialog = false;
      this.$emit('onSelectProducerId', arg.id);
    }
  }
})
</script>
