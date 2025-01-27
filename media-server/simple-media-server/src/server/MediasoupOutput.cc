#include "MediasoupOutput.h"

MediasoupOutput::MediasoupOutput(Settings &settings) : MediaOutput(settings), mMediasoupClient(settings.name)
{
}

MediasoupOutput::~MediasoupOutput()
{
  stop();
}

void MediasoupOutput::start()
{
  for (auto info : mSettings.streamInfoList) {
    mMediasoupClient.createMediaProducer(info);
  }
  mMediasoupClient.connect(mSettings.ws, mSettings.origin);
}

void MediasoupOutput::stop()
{
  mMediasoupClient.disconnect();
}

void MediasoupOutput::resume()
{
  // mMediasoupClient.resume();
}

void MediasoupOutput::pause()
{
  // mMediasoupClient.pause();
}

void MediasoupOutput::sendVideoData(const uint8_t *data, const uint32_t size, const uint32_t timestamp)
{
  // mMediasoupClient.sendVideoData(streamKey, data, size);
}

void MediasoupOutput::sendAudioData(const uint8_t *data, const uint32_t size, const uint32_t timestamp)
{
  // mMediasoupClient.sendAudioData(streamKey, data, size);
}
