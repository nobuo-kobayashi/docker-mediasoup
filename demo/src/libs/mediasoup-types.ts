
function uuid() {
  let uuid = "", i, random;
  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0;
    if (i == 8 || i == 12 || i == 16 || i == 20) {
      uuid += "-"
    }
    uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
  }
  return uuid;
}

export class MediasoupProducerParams {
  id:string;
  name:string;
  stream?:MediaStream;

  constructor(name:string) {
    this.id = uuid();
    this.name = name;
  }
}

export class MediasoupConsumerParams {
  id:string
  name:string;
  producerIds = new Array<string>();
  dataProducerId?:string;
  remoteVideo?:HTMLVideoElement;

  constructor(id:string, name:string) {
    this.id = id;
    this.name = name;
  }
}
