# mediasoup

mediasoup の動作確認を行うためのサンプルになります。

mediasoup の詳細については、本家のページでご確認ください。<br>
- [https://mediasoup.org/](https://mediasoup.org/)
- [https://github.com/versatica/mediasoup](https://github.com/versatica/mediasoup)

## SDP に格納される IP アドレス

`mediasoup/config/mediasoup-config.json` の announcedIp に、使用するグローバル IP を指定してください。

announcedIp は、SDP に格納される IP アドレスになります。<br>

```json
  "webRtcTransportOptions": {
    "listenIps": [
      { "ip": "127.0.0.1" },
      { "ip": "0.0.0.0", "announcedIp": "Your IP address" }
    ],
        :
       省略
        :
  "plainTransportOptions": {
    "listenIp": { "ip": "0.0.0.0", "announcedIp": "Your IP address" }
  }
```

## 使用するポート番号

`docker-compose.yml` に mediasoup で使用するポート番号を指定しています。

```yml
    ports:
      - "3000:3000"
      - "40000-40100:40000-40100"
      - "40000-40100:40000-40100/udp"
```

`mediasoup/config/mediasoup-config.json` にも同じように mediasoup で使用するポート番号を指定しています。

```ts
  "workerOptions": {
    "rtcMinPort": 40000,
    "rtcMaxPort": 40100,
        :
       省略
```

ここに指定したポート番号を使用して、mediasoup に接続しますので、変更する場合には、2つのファイルを同じく値になる様に変更してください。

使用する範囲を広げると docker 起動に時間がかかりますので、サーバのスペックによっては範囲を小さくするなどをしてください。

## ビルド

以下のコマンドで、mediasoup をビルドします。

```
$ docker compose build
```

## 起動

以下のコマンドで mediasoup を起動します。

```
$ docker compose up
```

## SSL 化

`certs` フォルダに、証明書を格納します。

証明書は、`docker-compose.yml` で docker とファイルを共有します。

```yaml
    volumes:
      - ./certs:/opt/certs
```

`docker-compose.yml` で環境変数の `MEDIASOUP_SSL` を true に設定します。

```yaml
    environment:
      - MEDIASOUP_PORT=3000
      - MEDIASOUP_SSL=true
```

`main.ts` では、以下のようにして証明書が存在する場合には、SSL 用のサーバとして起動します。

```ts
const USE_SSL = process.env.MEDIASOUP_SSL;
const SERVER_KEY = '/opt/certs/server.key';
const SERVER_CRT = '/opt/certs/server.crt';
       :
      省略
       :
if (USE_SSL == 'true' && fs.existsSync(SERVER_KEY) && fs.existsSync(SERVER_CRT)) {
  server = https.createServer({
    key: fs.readFileSync(SERVER_KEY),
    cert: fs.readFileSync(SERVER_CRT)
  }, app);
}
```

証明書がなかったり、`MEDIASOUP_SSL` が設定されていない場合には、http で起動します。

# サンプルアプリ

mediasoup と連携して動作する Web アプリになります。<br>
vue3 で作成してありますので、以下の手順でビルドを行ってください。

## URL の設定

`demo/components/MyPage.vue` で接続先の mediasoup の URL を設定しています。<br>
IP アドレスとポート番号を mediasoup サーバに合わせて設定してください。

```ts
  setup() {
    // docker-compose.yml に定義されている MEDIASOUP_IP、MEDIASOUP_PORT
    // に、mediasoup サーバが起動していますので、その URL を指定します。
    const shceme = () => {
      return location.protocol.startsWith('https') ? 'wss' : 'ws';
    }
    const wsUrl = shceme() + '://' + location.hostname + ':3000';
    const mediasoup = new MediasoupDemo(wsUrl);
    return {
      mediasoup
    }
  },
```

サンプルでは、mediasoup と同じサーバで動作することを前提としていますので、アクセスしたホスト名にアクセスするようにしてあります。

## ビルド

yarn を使用してビルドを行います。

```
$ cd demo
$ yarn install
```

## 起動

以下のコマンドで、サンプルアプリを起動します。

```
$ cd demo
$ yarn serve
```

## サンプルアプリの実行

chrome ブラウザなどで、起動したサンプルアプリに接続します。

```
http://192.168.xxx.xxx:8080
```

## https 化

`demo/vue.config.js` で、server の type を `http` から `https` に変更することで、サンプルアプリを https で起動することができます。

カメラやマイクなどを使用する場合には変更してください。

```javascript
  devServer: {
    server: {
      type: 'https'
    }
  },
```

# GStreamer から配信

mediasoup に対して GStreamer から映像配信を行います。<br>
GStreamer の制御は、nodejs で行っています。

## 使用するポート番号の設定

`docker-compose-gst.yml` に gstreamer から mediasoup に接続するための IP とポート番号を指定します。

```yml
    environment:
      - MEDIASOUP_IP=192.168.xxx.xxx
      - MEDIASOUP_PORT=3000
      - MEDIASOUP_SSL=false
```

同じ端末で mediasoup の docker を起動している場合には、`MEDIASOUP_IP` を `mediasoup` と指定することで配信することができます。

```yml
    environment:
      - MEDIASOUP_IP=mediasoup
      - MEDIASOUP_PORT=3000
      - MEDIASOUP_SSL=false
```

## ビルド

```
$ docker compose -f docker-compose-gst.yml build
```

## 起動

```
$ docker compose -f docker-compose-gst.yml up
```
