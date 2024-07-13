import * as mediasoup from 'mediasoup';
import { getLogger } from "log4js";

const logger = getLogger();

export class MediasoupDebugInfo {
  public static init() : void {
    mediasoup.observer.on('newworker', (worker:any) =>{
      logger.debug('new worker created [worke.pid:%d]', worker.pid);

      worker.observer.on('close', () => {
        logger.debug('worker closed [worker.pid:%d]', worker.pid);
      });

      worker.observer.on('newrouter', (router:any) => {
        logger.debug(`new router created [worker.pid:${worker.pid}, router.id:${router.id}]`);
        router.observer.on('close', () => {
          logger.debug(`router closed [router.id:${router.id}]`);
        });

        router.observer.on('newtransport', (transport:any) => {
          logger.debug(`new transport created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}]`);

          transport.observer.on('close', () => {
            logger.debug(`transport closed [transport.id:${transport.id}]`);
          });

          transport.observer.on('newproducer', (producer:any) => {
            logger.debug(`new producer created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}, producer.id:${producer.id}]`);
            producer.observer.on('close', () => {
              logger.debug(`producer closed [producer.id:${producer.id}]`);
            });
            // producer.enableTraceEvent([ "rtp" ]);
            // producer.on('trace', (trace:any) => {
            //   if (trace.info.rtpPacket.isKeyFrame) {
            //     logger.debug('@@@ producer', trace);
            //   } else {
            //     logger.debug(`@@@ producer sequenceNumber=${trace.info.rtpPacket.sequenceNumber} payloadType=${trace.info.rtpPacket.payloadType} payloadSize=${trace.info.rtpPacket.payloadSize} timestamp=${trace.info.rtpPacket.timestamp}`);
            //   }
            // });
          });

          transport.observer.on('newconsumer', (consumer:any) => {
            logger.debug(`new consumer created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}, consumer.id:${consumer.id}]`);
            consumer.observer.on('close', () => {
              logger.debug(`consumer closed [consumer.id:${consumer.id}]`);
            });
            // consumer.enableTraceEvent([ "rtp" ]);
            // consumer.on('trace', (trace:any) => {
            //   logger.debug('@@@ consumer', trace);
            // });
          });

          transport.observer.on('newdataproducer', (dataProducer:any) => {
            logger.debug(`new data producer created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}, dataProducer.id:${dataProducer.id}]`);

            dataProducer.observer.on('close', () => {
              logger.debug(`data producer closed [dataProducer.id:${dataProducer.id}]`);
            });
          });

          transport.observer.on('newdataconsumer', (dataConsumer:any) => {
            logger.debug(`new data consumer created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}, dataConsumer.id:${dataConsumer.id}]`);
            dataConsumer.observer.on('close', () => {
              logger.debug(`data consumer closed [dataConsumer.id:${dataConsumer.id}]`);
            });
          });
        });
      });

      worker.observer.on('newwebrtcserver', (webRtcServer:any) => {
        logger.debug(`new WebRTC server created [worker.pid:${worker.pid}, webRtcServer.id:${webRtcServer.id}]`);
        webRtcServer.observer.on('close', () => {
          logger.debug(`WebRTC server closed [webRtcServer.id:${webRtcServer.id}]`);
        });
      });
    });
  }
}
