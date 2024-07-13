import express from 'express';
import * as https from 'https';
import * as fs from 'fs';
import { MediasoupServer } from './mediasoup-server';
import { MediasoupDebugInfo } from './mediasoup-debug-info';
import { initLog4js } from './mediasoup-log';

const USE_SSL = process.env.MEDIASOUP_SSL;
const SERVER_KEY = '/opt/certs/server.key';
const SERVER_CRT = '/opt/certs/server.crt';
const CONFIG_FILE_LOG = '/opt/config/log4js-config.json';
const CONFIG_FILE_MEDIASOUP = '/opt/config/mediasoup-config.json';

initLog4js(CONFIG_FILE_LOG);

const port = process.env.MEDIASOUP_PORT ? parseInt(process.env.MEDIASOUP_PORT) : 3000;
const htmlDir = '/opt/data/html';
const app: express.Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', express.static(htmlDir));

let server = undefined;
let serverOptions = {
  perMessageDeflate: false,
};

if (USE_SSL == 'true' && fs.existsSync(SERVER_KEY) && fs.existsSync(SERVER_CRT)) {
  server = https.createServer({
    key: fs.readFileSync(SERVER_KEY),
    cert: fs.readFileSync(SERVER_CRT)
  }, app);
}

// デバッグ出力を行います。
// 不要の場合はコメントアウトしてください。
MediasoupDebugInfo.init();

// mediasoup を起動します。
const mediasoup = new MediasoupServer(app, server, serverOptions, CONFIG_FILE_MEDIASOUP);

if (server) {
  server.listen(port, () => {
    console.log(`Start https on port ${port}.`);
  });
} else {
  app.listen(port, () => {
    console.log(`Start http on port ${port}.`);
  });
}
