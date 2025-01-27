#include "MediaServer.h"

MediaServer::MediaServer(Settings& settings) : mSettings(settings), mMediasoupClient(settings.name)
{
}

MediaServer::~MediaServer()
{
  mRtmpServer.shutdown();
  mMediasoupClient.disconnect();
    mCache.stopProcessing();

}

void MediaServer::process()
{
  mCache.startProcessing([this](std::string streamKey, const uint8_t *data, uint32_t size, uint32_t timestamp) {
    mMediasoupClient.sendVideoData(streamKey, data, size);
  });
  startMediasoupClient();
  startRTMPServer();
}

void MediaServer::startRTMPServer()
{
  mRtmpServer.setListener(this);
  mRtmpServer.useSSL(mSettings.certFile, mSettings.keyFile);
  mRtmpServer.listen(mSettings.port);
}

void MediaServer::startMediasoupClient()
{
  for (auto info : mSettings.streamInfoList) {
    mMediasoupClient.createMediaProducer(info);
  }
  mMediasoupClient.connect(mSettings.ws, mSettings.origin);
}

// RTMPServerListener implements.

bool MediaServer::onStreamKey(RTMPServer *server, std::string streamKey)
{
  for (auto info : mSettings.streamInfoList) {
    if (streamKey.compare(info->streamKey) == 0) {
      mMediasoupClient.resume(streamKey);
      return true;
    }
  }
  // 設定ファイルに存在しない streamKey なので、false を返却します。
  return false;
}

void MediaServer::onClosed(RTMPServer *server, std::string streamKey)
{
  mMediasoupClient.pause(streamKey);
}

void MediaServer::onReceivedVideoConfig(RTMPServer *server, std::string streamKey, AVCDecoderConfigurationRecord *config)
{
}

void MediaServer::onReceivedAudioConfig(RTMPServer *server, std::string streamKey, AudioSpecificConfig *config)
{
}

void MediaServer::onReceivedVideoData(RTMPServer *server, std::string streamKey, const uint8_t *data, const uint32_t size, uint32_t timestamp)
{
  mMediasoupClient.sendVideoData(streamKey, data, size);
  // FrameBuffer frame(streamKey, data, size, timestamp);
  // mCache.addFrame(frame);
}

void MediaServer::onReceivedAudioData(RTMPServer *server, std::string streamKey, const uint8_t *data, const uint32_t size, uint32_t timestamp)
{
  mMediasoupClient.sendAudioData(streamKey, data, size);
}
