import { Mediasoup } from "./mediasoup";

export class MediasoupSession {
  private id:string;
  private name:string;
  private description?:string;
  private mediasoup: Mediasoup;

  constructor(id:string, name:string, description?:string) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.mediasoup = new Mediasoup(id, name);
  }
}
