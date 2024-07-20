#include "MediaServer.h"

MediaServer::MediaServer(Settings& settings) : mSettings(settings), mMediasoupClient(settings.name)
{
}

MediaServer::~MediaServer()
{
  mRtmpServer.shutdown();
  mMediasoupClient.disconnect();
}

void MediaServer::process()
{
  mRtmpServer.setListener(this);
  mRtmpServer.useSSL(mSettings.certFile, mSettings.keyFile);
  mRtmpServer.listen(mSettings.port);

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

void MediaServer::onReceivedVideoData(RTMPServer *server, std::string streamKey, const char *data, const uint32_t size)
{
  mMediasoupClient.sendVideoData(streamKey, data, size);
}

void MediaServer::onReceivedAudioData(RTMPServer *server, std::string streamKey, const char *data, const uint32_t size)
{
  mMediasoupClient.sendAudioData(streamKey, data, size);
}
