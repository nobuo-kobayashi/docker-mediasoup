import { v4 as uuidv4 } from 'uuid';
import { WebsocketClient, WSEvent } from "./websocket-client";
import { AsyncQueue, AsyncTask } from "./async-queue";

type CallbackFunction = (type:string, payload:any, error:any) => void;

class WebsocketTask {
  uuid:string;
  request:string;
  callback:CallbackFunction;
  timerId:number|undefined;

  constructor(uuid:string, request:string, callback:CallbackFunction) {
    this.uuid = uuid;
    this.request = request;
    this.callback = callback;
    this.timerId = setTimeout(() => {
      callback(uuid, undefined, {
        code: 0,
        message: 'timeout'
      });
    }, 15 * 1000);
  }

  clearTimer() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = undefined;
    }
  }
}

export class MediasoupWebsocket extends WebsocketClient {
  private requestMap:Map<string, WebsocketTask> = new Map();
  private queue = new AsyncQueue();

  constructor(url:string) {
    super(url);
    this.on(WSEvent.KEY_WS_MESSAGE, this.onMessage.bind(this));
  }

  async sendMessage(message:string) : Promise<any> {
    return new Promise<void>((resolve, reject) => {
      this.queue.enqueue(this.createTask(message, (_:string, payload:any, error:any) => {
        if (error) {
          reject(error);
        } else {
          resolve(payload);
        }
      }));
    });
  }

  private onMessage(message:string) {
    let json = null;
    try {
      json = JSON.parse(message);
    } catch (e) {
      console.error('JSON parse error: ' + message, e);
      return;
    }

    const uuid = json.uuid;
    if (uuid) {
      const task = this.requestMap.get(uuid);
      if (task) {
        if (!this.requestMap.delete(uuid)) {
          console.warn(`Failed to delete a task. uuid=${uuid}`);
        }
        const payload = json.payload;
        const error = json.error;
        task.callback(uuid, payload, error);
      } else {
        console.warn(`Not found a task. uuid=${uuid}`);
      }
    } else {
      console.error(`uuid is undefined.`);
    }
  }

  private createTask(message:string, callback:CallbackFunction) : AsyncTask {
    return () => new Promise<void>((resolve, reject) => {
      try {
        // リクエスト
        // {
        //   id: 'xxxx',
        //   uuid: 'XXXX'
        //   type: 'XXXX',
        //   payload: {}
        // }

        // レスポンス
        // {
        //   id: 'xxxx',
        //   uuid: 'XXXX'
        //   type: 'XXXX',
        //   payload: {},
        //   error: {
        //     code: 'xxxx',
        //     message: 'XXXX'
        //   }
        // }

        // リクエストに対するレスポンスは、uuid で一致することを確認します。
        // サーバー側でエラーが発生した場合は、error の要素にエラーコードとメッセージが格納されます。

        const json = JSON.parse(message);
        json.uuid = uuidv4();
        console.log('send message: ' + json.uuid);
        const task = new WebsocketTask(json.uuid, JSON.stringify(json), (uuid:string, payload:any, error:any) => {
          console.log('recv message: ' + uuid);
          task.clearTimer();
          callback(uuid, payload, error);
          resolve();
        });
        this.requestMap.set(json.uuid, task);
        this.send(JSON.stringify(json));
      } catch (error) {
        reject(error);
      }
    });
  }
}
