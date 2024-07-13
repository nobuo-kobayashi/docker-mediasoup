import { Mediasoup } from "./mediasoup";
import { getLogger } from "log4js";

const logger = getLogger();

export class MediasoupManager {
  private mediasoups: Map<string, Mediasoup> = new Map();
  private mediasoupConfigPath:string;

  constructor(mediasoupConfigPath:string) {
    this.mediasoupConfigPath = mediasoupConfigPath;
  }

  getMediasoupById(id:string) : Mediasoup | undefined {
    return this.mediasoups.get(id);
  }

  async createMediasoup(id:string, name:string) {
    if (this.mediasoups.has(id)) {
      return undefined;
    }
    const mediasoup = new Mediasoup(id, name);
    await mediasoup.init(this.mediasoupConfigPath);
    this.mediasoups.set(id, mediasoup);
    return mediasoup;
  }

  removeMediasoup(id:string) {
    const mediasoup = this.getMediasoupById(id);
    if (mediasoup) {
      if (!this.mediasoups.delete(id)) {
        logger.warn(`Failed to delete a mediasoup. id=${id}`);
      }
      try {
        mediasoup.close();
      } catch (e) {
        // ignore.
      }
    }
  }

  async getOrCreateMediasoup(id:string) : Promise<Mediasoup> {
    let mediasoup = this.getMediasoupById(id);
    if (!mediasoup) {
      mediasoup = await this.createMediasoup(id, '');
      if (!mediasoup) {
        throw Error(`Failed to create Mediasoup by id[${id}].`);
      }
    }
    return mediasoup;
  }

  async getCapabilities(id:string) : Promise<any> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return mediasoup.getCapabilities();
    }
    return undefined;
  }

  async createWebRtcTransport(id:string) : Promise<any> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.createWebRtcTransport();
    }
    return undefined;
  }

  async deleteTransport(id:string, transportId:string) : Promise<void> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      mediasoup.deleteTransport(transportId);
    }
  }

  async createPlainTransport(id:string, payload:any) : Promise<any> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.createPlainTransport(payload);
    }
    return undefined;
  }

  async connect(id:string, payload:any) : Promise<void> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      await mediasoup.connect(payload);
    }
  }

  // 映像・音声

  async getProducerIds(id:string) : Promise<IterableIterator<string> | undefined> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return mediasoup.getProducerIds();
    }
    return undefined;
  }

  async getProducers(id:string) : Promise<IterableIterator<any> | undefined> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return mediasoup.getProducers();
    }
    return undefined;
  }

  async findProducer(id:string, producerId:string) : Promise<any> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.findProducer(producerId);
    }
    return undefined;
  }

  async createProducer(id:string, payload:any) : Promise<any> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.createProducer(payload);
    }
    return undefined;
  }

  async pauseProducer(id:string, producerId:string) : Promise<any> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return mediasoup.pauseProducer(producerId);
    }
    return undefined;
  }

  async resumeProducer(id:string, producerId:string) : Promise<any> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return mediasoup.resumeProducer(producerId);
    }
    return undefined;
  }

  async createConsumer(id:string, payload:any) : Promise<any> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.createConsumer(payload);
    }
    return undefined;
  }

  // データチャンネル

  async getDataProducers(id:string) : Promise<IterableIterator<any> | undefined> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return mediasoup.getDataProducers();
    }
    return undefined;
  }

  async createDataProducer(id:string, payload:any) : Promise<any> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.createDataProducer(payload);
    }
    return undefined;
  }

  async createDataConsumer(id:string, payload:any) : Promise<any> {
    const mediasoup = await this.getOrCreateMediasoup(id);
    if (mediasoup) {
      return await mediasoup.createDataConsumer(payload);
    }
    return undefined;
  }
}
