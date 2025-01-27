#include "RTMPInput.h"

RTMPInput::RTMPInput(Settings &settings) : MediaInput(settings)
{
}

RTMPInput::~RTMPInput()
{
  mRtmpServer.shutdown();
  mConv.destroy();
}

// RTMPServerListener implements.
bool RTMPInput::onStreamKey(RTMPServer *server, std::string streamKey)
{
  for (auto info : mSettings.streamInfoList) {
    if (streamKey.compare(info->streamKey) == 0) {
      if (mMediaOutput.get() != nullptr) {
        // mMediaOutput->resume(streamKey);
      }
      return true;
    }
  }
  // 設定ファイルに存在しない streamKey なので、false を返却します。
  return false;
}

void RTMPInput::onClosed(RTMPServer *server, std::string streamKey)
{
  if (mMediaOutput.get() != nullptr) {
    // mMediaOutput->pause(streamKey);
  }
}

void RTMPInput::onReceivedVideoConfig(RTMPServer *server, std::string streamKey, AVCDecoderConfigurationRecord *config)
{
}

void RTMPInput::onReceivedAudioConfig(RTMPServer *server, std::string streamKey, AudioSpecificConfig *config)
{
  mConv.init(config);
}

void RTMPInput::onReceivedVideoData(RTMPServer *server, std::string streamKey, const uint8_t *data, const uint32_t size, uint32_t timestamp)
{
  if (mMediaOutput.get() != nullptr) {
    mMediaOutput->sendVideoData(data, size, timestamp);
  }
}

void RTMPInput::onReceivedAudioData(RTMPServer *server, std::string streamKey, const uint8_t *data, const uint32_t size, uint32_t timestamp)
{
  // AAC を Opus に変換します。
  mConv.conv(data, size, [this, timestamp](const uint8_t *data, uint32_t size) {
    if (mMediaOutput.get() != nullptr) {
      mMediaOutput->sendAudioData(data, size, timestamp);
    }
  });
}

void RTMPInput::start()
{
  mRtmpServer.setListener(this);
  mRtmpServer.useSSL(mSettings.certFile, mSettings.keyFile);
  mRtmpServer.listen(mSettings.port);
}

void RTMPInput::stop()
{
  mRtmpServer.shutdown();
}
