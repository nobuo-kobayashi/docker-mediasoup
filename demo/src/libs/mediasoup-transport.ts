import { Device } from "mediasoup-client";
import { Transport } from "mediasoup-client/lib/Transport";
import { MediasoupEventEmitter } from './mediasoup-events';

export const ProducerEvent = {
  KEY_PRODUCER_CONNECT: 'producer-connect',
  KEY_PRODUCER_PRODUCE: 'producer-produce',
}

export class MediasoupTransport extends MediasoupEventEmitter {
  private transport?:Transport;
}
