FROM node:20.9.0-slim

# プログラムを実行するフォルダ
ENV WORK_FOLDER /opt/mediasoup

RUN apt-get update && apt-get install -y --no-install-recommends \
  net-tools \
  build-essential \
  python3 \
  python3-pip \
  valgrind

WORKDIR ${WORK_FOLDER}

COPY mediasoup/ ${WORK_FOLDER}

RUN cd ${WORK_FOLDER} && yarn install

CMD sh -c "yarn start"
