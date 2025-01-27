import { MediasoupConsumer } from "./mediasoup-consumer";
import { MediasoupProducer } from "./mediasoup-producer";

export class MediasoupRoom {
  private producer?:MediasoupProducer;
  private consumers:Array<MediasoupConsumer> = [];
}
