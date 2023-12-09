cmake_minimum_required(VERSION 3.10)

# プロジェクト名と使用する言語を設定
project(simple-media-server C CXX)

# pkg-config を使ってモジュールを読み込む
find_package(PkgConfig)
find_package(OpenSSL REQUIRED)
find_package(ZLIB REQUIRED)
find_package(JRTPLIB REQUIRED)

# ライブラリの存在チェック
pkg_check_modules(RTMP REQUIRED 
  fdk-aac
  glib-2.0
  jrtplib
  libsoup-2.4
  librtmp
  nlohmann_json
  openssl
  opus
  zlib)

# ヘッダーファイルとライブラリへのパスを表示
message("RTMP_INCLUDE_DIRS: ${RTMP_INCLUDE_DIRS}")
message("RTMP_LIBRARY_DIRS: ${RTMP_LIBRARY_DIRS}")

# C コンパイルフラグを設定
set(CMAKE_C_FLAGS "-Wall -DUSE_OPENSSL -D_CRT_SECURE_NO_WARNINGS")
set(CMAKE_C_FLAGS_DEBUG "-g3 -O0 -pg")
set(CMAKE_C_FLAGS_RELEASE "-O2 -s -DNDEBUG -march=native")
set(CMAKE_C_FLAGS_RELWITHDEBINFO "-g3 -Og -pg")
set(CMAKE_C_FLAGS_MINSIZEREL "-Os -s DNDEBUG -march=native")

# C++ コンパイルフラグを設定
set(CMAKE_CXX_FLAGS "-Wall -DUSE_OPENSSL -D_CRT_SECURE_NO_WARNINGS -std=c++17")
set(CMAKE_CXX_FLAGS_DEBUG "-g -DDEBUG_BUILD")
set(CMAKE_CXX_FLAGS_RELEASE "-O2 -s -DNDEBUG -march=native")
set(CMAKE_CXX_FLAGS_RELWITHDEBINFO "-g3 -Og -pg")
set(CMAKE_CXX_FLAGS_MINSIZEREL "-Os -s DNDEBUG -march=native")

# 実行ファイルの作成
add_executable(simple-media-server
  src/mediasoup/MediaProducer.cc
  src/mediasoup/MediasoupClient.cc
  src/codec/aac/AACDecoder.cc
  src/codec/aac/AudioSpecificConfig.cc
  src/codec/h264/AVCDecoderConfigurationRecord.cc
  src/codec/opus/OpusEncoder.cc
  src/rtmp/RTMPClient.cc
  src/rtmp/RTMPServer.cc
  src/rtmp/RTMPUtility.cc
  src/rtp/H264RTPSender.cc
  src/rtp/OpusRTPSender.cc
  src/rtp/RTPSender.cc
  src/utils/AAC2OpusConv.cc
  src/utils/BaseThread.cc
  src/utils/BitReader.cc
  src/utils/NetworkUtils.cc
  src/utils/WebsocketClient.cc
  src/MediaServer.cc
  src/Settings.cc
  src/main.cc)

# ヘッダーへのパスを設定
target_include_directories(simple-media-server PUBLIC ${RTMP_INCLUDE_DIRS})

# リンクするライブラリの設定
target_link_libraries(simple-media-server ${RTMP_LIBRARIES})
target_link_libraries(simple-media-server pthread)
target_link_libraries(simple-media-server /usr/local/lib/libjrtp.so)

# コンパイルオプションを設定
target_compile_options(simple-media-server PUBLIC ${RTMP_CFLAGS_OTHER})
