FROM node:16

# プログラムを実行するフォルダ
ENV WORK_FOLDER /opt/mediasoup

RUN apt-get update && apt-get install -y \
  net-tools \
  build-essential \
  python3 \
  python3-pip \
  valgrind

WORKDIR ${WORK_FOLDER}

RUN npm install -g npm@9.6.1

RUN cd ${WORK_FOLDER} \
  && npm install express \
  && npm install express-ws \
  && npm install typescript \
  && npm install @types/express \
  && npm install @types/express-ws \
  && npm install @types/node \
  && npm install ts-node \
  && npm install mediasoup

COPY mediasoup/ ${WORK_FOLDER}

RUN cd ${WORK_FOLDER} \
  && ./node_modules/.bin/tsc --build

CMD [ "yarn", "start" ]
