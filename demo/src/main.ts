import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import { MediasoupDemo } from '@/libs/mediasoup-demo'

loadFonts()

// docker-compose.yml に定義されている MEDIASOUP_IP、MEDIASOUP_PORT
// に、mediasoup サーバが起動していますので、その URL を指定します。
const shceme = () => {
  return location.protocol.startsWith('https') ? 'wss' : 'ws';
}
const port = 3000;
const wsUrl = shceme() + '://' + location.hostname + ':' + port;

const app = createApp(App)

app.config.globalProperties.$mediasoup = new MediasoupDemo(wsUrl);

app.use(router)
  .use(vuetify)
  .mount('#app')
