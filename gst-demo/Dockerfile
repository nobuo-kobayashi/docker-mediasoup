FROM ubuntu:20.04

# プログラムを実行するフォルダ
ENV WORK_FOLDER /opt/broadcaster

# 作業用のフォルダ指定
WORKDIR ${WORK_FOLDER}/

# タイムゾーンの設定
RUN apt-get update && apt-get install -y --no-install-recommends tzdata
ENV TZ=Asia/Tokyo

# gstreamer をインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  curl \
  gstreamer1.0-tools \
  gstreamer1.0-alsa \
  gstreamer1.0-plugins-base \
  gstreamer1.0-plugins-good \
  gstreamer1.0-plugins-bad \
  gstreamer1.0-plugins-ugly \
  gstreamer1.0-libav \
  net-tools \
  python3 \
  python3-pip 

# nodejs のインストール
# nodejs v16 の最新を指定しています。
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash \
&& apt-get install -y --no-install-recommends nodejs

RUN npm install -g npm@9.6.2

COPY broadcaster/ ${WORK_FOLDER}

RUN cd ${WORK_FOLDER} \
  && npm install @types/node \
  && npm install @types/ws \
  && npm install ts-node \
  && npm install typescript \
  && npm install ws
 
RUN cd ${WORK_FOLDER} \
  && ./node_modules/.bin/tsc --build

CMD [ "npm", "run", "start" ]
