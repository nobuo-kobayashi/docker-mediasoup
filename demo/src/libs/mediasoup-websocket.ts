/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuidv4 } from 'uuid';
import { WebsocketClient, WSEvent } from "./websocket-client";
import { AsyncQueue, AsyncTask } from "./async-queue";

type WebsocketCallbackFunction = (type:string, payload:any, error:any) => void;

class WebsocketTask {
  uuid:string;
  request:string;
  callback:WebsocketCallbackFunction;
  timerId:number|undefined;

  constructor(uuid:string, request:string, callback:WebsocketCallbackFunction, timeout:number = 10 * 1000) {
    this.uuid = uuid;
    this.request = request;
    this.callback = callback;
    if (timeout > 0) {
      this.timerId = setTimeout(() => {
        callback(uuid, undefined, new MediasoupError('0', 'timeout'));
      }, timeout);
    }
  }

  clearTimer() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = undefined;
    }
  }
}

export class MediasoupError extends Error {
  code:string;
  constructor(code:string, message:string) {
    super(message);
    this.code = code;
  }
}

export class MediasoupWebsocket extends WebsocketClient {
  private requestMap:Map<string, WebsocketTask> = new Map();
  private queue = new AsyncQueue();
  private timeout = 10 * 1000;

  constructor(url:string) {
    super(url);
    this.on(WSEvent.KEY_WS_MESSAGE, this.onMessage.bind(this));
  }

  setTimeout(timeout:number) {
    this.timeout = timeout;
  }

  async sendMessageInSequence(message:string|object) : Promise<any> {
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
        console.error(`Not found a task. uuid=${uuid}`);
      }
    } else {
      console.error(`uuid is undefined.`);
    }
  }

  private createTask(message:string|object, callback:WebsocketCallbackFunction) : AsyncTask {
    return () => new Promise<void>((resolve, reject) => {
      if (!this.isConnected()) {
        callback('', undefined, new MediasoupError('0', 'websocket not connected.'));
        reject();
      }

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

        const json = typeof(message) !== 'string' ? message : JSON.parse(message);
        json.uuid = uuidv4();
        console.log('send message: ' + json.uuid);
        const task = new WebsocketTask(json.uuid, JSON.stringify(json), (uuid:string, payload:any, error:any) => {
          console.log('recv message: ' + uuid);
          task.clearTimer();
          callback(uuid, payload, error);
          resolve();
        }, this.timeout);
        this.requestMap.set(json.uuid, task);
        this.send(JSON.stringify(json));
      } catch (error) {
        callback('', undefined, error);
        reject(error);
      }
    });
  }
}
