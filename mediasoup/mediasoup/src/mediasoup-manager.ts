import { Mediasoup } from "./mediasoup";

export class MediasoupManager {
  private mediasoups: Map<string, Mediasoup>

  constructor() {
    this.mediasoups = new Map();
  }

  getMediasoupById(id:string) : Mediasoup | undefined {
    return this.mediasoups.get(id);
  }

  async getOrCreateMediasoup(id:string) : Promise<Mediasoup> {
    let mediasoup = this.getMediasoupById(id);
    if (!mediasoup) {
      mediasoup = new Mediasoup(id);
      await mediasoup.init();
      this.mediasoups.set(id, mediasoup);
    }
    return mediasoup;
  }

  async getCapabilities(id:string) : Promise<any> {
    let mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return mediasoup.getCapabilities();
    }
    return undefined;
  }

  async createWebRtcTransport(id:string) : Promise<any> {
    let mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.createWebRtcTransport();
    }
    return undefined;
  }

  async deleteTransport(id:string, transportId:string) : Promise<void> {
    let mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      await mediasoup.deleteTransport(transportId);
    }
  }

  async createPlainTransport(id:string, payload:any) : Promise<any> {
    let mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.createPlainTransport(payload);
    }
    return undefined;
  }

  async connect(id:string, payload:any) : Promise<void> {
    let mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      await mediasoup.connect(payload);
    }
  }

  // 映像・音声

  async getProducers(id:string) : Promise<IterableIterator<string> | undefined> {
    let mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.getProducers();
    }
    return undefined;
  }

  async findProducer(id:string, producerId:string) : Promise<any> {
    let mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.findProducer(producerId);
    }
    return undefined;
  }

  async createProducer(id:string, payload:any) : Promise<any> {
    let mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.createProducer(payload);
    }
    return undefined;
  }

  async pauseProducer(id:string, producerId:string) : Promise<any> {
    let mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return mediasoup.pauseProducer(producerId);
    }
    return undefined;
  }

  async resumeProducer(id:string, producerId:string) : Promise<any> {
    let mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return mediasoup.resumeProducer(producerId);
    }
    return undefined;
  }

  async createConsumer(id:string, payload:any) : Promise<any> {
    let mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.createConsumer(payload);
    }
    return undefined;
  }

  // データチャンネル

  async getDataProducers(id:string) : Promise<IterableIterator<string> | undefined> {
    let mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.getDataProducers();
    }
    return undefined;
  }

  async createDataProducer(id:string, payload:any) : Promise<any> {
    let mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.createDataProducer(payload);
    }
    return undefined;
  }

  async createDataConsumer(id:string, payload:any) : Promise<any> {
    let mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.createDataConsumer(payload);
    }
    return undefined;
  }
}
