import { Mediasoup } from "./mediasoup";
import { getLogger } from "log4js";

const logger = getLogger();

export const DEFAULT_MEDIASOUP_ID = 'mediasoup001';

export class MediasoupManager {
  private mediasoups: Map<string, Mediasoup> = new Map();
  private mediasoupConfigPath:string;

  constructor(mediasoupConfigPath:string) {
    this.mediasoupConfigPath = mediasoupConfigPath;
    this.createMediasoup(DEFAULT_MEDIASOUP_ID, 'test');
  }

  getMediasoupList() : IterableIterator<Mediasoup> {
    return this.mediasoups.values();
  }

  getMediasoupById(id:string) : Mediasoup | undefined {
    return this.mediasoups.get(id);
  }

  async createMediasoup(id:string, name:string) : Promise<Mediasoup | undefined> {
    if (this.mediasoups.has(id)) {
      return undefined;
    }
    const mediasoup = new Mediasoup(id, name);
    await mediasoup.init(this.mediasoupConfigPath);
    this.mediasoups.set(id, mediasoup);
    logger.info(`Create a Mediasoup session. id=${id} name=${name}`);
    return mediasoup;
  }

  removeMediasoup(id:string) {
    const mediasoup = this.getMediasoupById(id);
    if (mediasoup) {
      if (!this.mediasoups.delete(id)) {
        logger.warn(`Failed to delete a mediasoup. id=${id}`);
      }
      try {
        logger.info(`Remove a Mediasoup session. id=${id}`);
        mediasoup.close();
      } catch (e) {
        // ignore.
      }
    }
  }
}
