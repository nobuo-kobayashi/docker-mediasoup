import { EventEmitter } from 'events';

export class MediasoupEventEmitter {
  protected emitter:EventEmitter = new EventEmitter();

  on(key:string, callback:any) {
    this.emitter.on(key, callback);
  }

  emit(key:string, message:any = undefined) {
    this.emitter.emit(key, message);
  }
}
