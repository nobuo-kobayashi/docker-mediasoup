import express from 'express'
import * as https from 'https';
import * as fs from 'fs';
import { MediasoupServer } from './mediasoup-server';
import { MediasoupDebugInfo } from './mediasoup-debug-info';

const USE_SSL = process.env.MEDIASOUP_SSL;
const SERVER_KEY = '/opt/certs/server.key';
const SERVER_CRT = '/opt/certs/server.crt';

const port = process.env.MEDIASOUP_PORT;
const htmlDir = '/opt/data/html';
const app: express.Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', express.static(htmlDir));

let server = undefined;
let serverOptions = undefined;

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
const mediasoup = new MediasoupServer(app, server, serverOptions);

if (server) {
  server.listen(port, () => {
    console.log(`Start on port ${port}.`);
  });
} else {
  app.listen(port, () => {
    console.log(`Start on port ${port}.`);
  });
}
