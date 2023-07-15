<template>
  <MyPage />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

// Components
import MyPage from '../components/MyPage.vue';

export default defineComponent({
  name: 'HomeView',

  components: {
    MyPage,
  },
});
</script>
