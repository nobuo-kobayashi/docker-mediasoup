const mediasoup = require('mediasoup');

export class MediasoupDebugInfo {
  constructor() {
  }

  public static init() : void {
    mediasoup.observer.on('newworker', (worker:any) =>{
      console.log('new worker created [worke.pid:%d]', worker.pid);

      worker.observer.on('close', () => {
        console.log('worker closed [worker.pid:%d]', worker.pid);
      });

      worker.observer.on('newrouter', (router:any) => {
        console.log(`new router created [worker.pid:${worker.pid}, router.id:${router.id}]`);
        router.observer.on('close', () => {
          console.log(`router closed [router.id:${router.id}]`);
        });

        router.observer.on('newtransport', (transport:any) => {
          console.log(`new transport created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}]`);

          transport.observer.on('close', () => {
            console.log(`transport closed [transport.id:${transport.id}]`);
          });

          transport.observer.on('newproducer', (producer:any) => {
            console.log(`new producer created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}, producer.id:${producer.id}]`);
            producer.observer.on('close', () => {
              console.log(`producer closed [producer.id:${producer.id}]`);
            });
          });

          transport.observer.on('newconsumer', (consumer:any) => {
            console.log(`new consumer created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}, consumer.id:${consumer.id}]`);
            consumer.observer.on('close', () => {
              console.log(`consumer closed [consumer.id:${consumer.id}]`);
            });
            // consumer.enableTraceEvent([ "rtp" ]);
            // consumer.on('trace', (trace:any) => {
            //   console.log('@@@ trace', trace);
            // });
          });

          transport.observer.on('newdataproducer', (dataProducer:any) => {
            console.log(`new data producer created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}, dataProducer.id:${dataProducer.id}]`);

            dataProducer.observer.on('close', () => {
              console.log(`data producer closed [dataProducer.id:${dataProducer.id}]`);
            });
          });

          transport.observer.on('newdataconsumer', (dataConsumer:any) => {
            console.log(`new data consumer created [worker.pid:${worker.pid}, router.id:${router.id}, transport.id:${transport.id}, dataConsumer.id:${dataConsumer.id}]`);
            dataConsumer.observer.on('close', () => {
              console.log(`data consumer closed [dataConsumer.id:${dataConsumer.id}]`);
            });
          });
        });
      });

      worker.observer.on('newwebrtcserver', (webRtcServer:any) => {
        console.log(`new WebRTC server created [worker.pid:${worker.pid}, webRtcServer.id:${webRtcServer.id}]`);
        webRtcServer.observer.on('close', () => {
          console.log(`WebRTC server closed [webRtcServer.id:${webRtcServer.id}]`);
        });
      });
    });
  }
}
