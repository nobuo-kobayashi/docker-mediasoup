FROM debian:bullseye-slim

# プログラムを実行するフォルダ
ENV WORK_FOLDER /opt

# タイムゾーンの設定
RUN apt-get -y update && apt-get -y install --no-install-recommends less vim

# volume directory
RUN mkdir /var/log/dovecot

# 必要なライブラリをインストール
RUN apt-get -y update && apt-get install -y --no-install-recommends \
    autoconf \
    automake \
    build-essential \
    ca-certificates \
    cmake \
    git \
    libtool \
    libglib2.0-dev \
    librtmp-dev \
    libopus-dev \
    libsoup-gnome2.4-dev \
    libssl-dev \
    ninja-build \
    pkg-config \
    python \
    python3-pip \
    zlib1g-dev

# meson のインストール
RUN pip3 install wheel
RUN pip3 install meson==0.59.2

RUN cd ${BUILD_FOLDER} \
&& git clone --depth 1 https://github.com/nlohmann/json \
&& cd json \
&& meson --buildtype=release build \
&& ninja -C build install

RUN mkdir -p /tmp/build \
&& cd /tmp/build \
&& git clone --depth 1 https://github.com/j0r1/JRTPLIB \
&& cd JRTPLIB \
&& mkdir -p build \
&& cd build \
&& cmake -DCMAKE_BUILD_TYPE=Release .. \
&& make \
&& make install

RUN mkdir -p /tmp/build \
&& cd /tmp/build \
&& git clone --depth 1 https://github.com/mstorsjo/fdk-aac \
&& cd fdk-aac \
&& bash autogen.sh \
&& ./configure \
&& make \
&& make install

COPY simple-media-server/ ${WORK_FOLDER}/simple-media-server

RUN mkdir -p ${WORK_FOLDER}/simple-media-server/build \
&& cd ${WORK_FOLDER}/simple-media-server/build \
&& cmake .. \
&& make

# JRTPLIB を使用するのに環境変数に LOGNAME が必要になるので定義しておきます。
ENV LOGNAME simple-media-server

EXPOSE 1935:1935
