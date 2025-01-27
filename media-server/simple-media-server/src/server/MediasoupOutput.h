#pragma once

#include "MediaOutput.h"
#include "../mediasoup/MediasoupClient.h"

class MediasoupOutput : public MediaOutput {
public:
  MediasoupOutput(Settings &settings);
  virtual ~MediasoupOutput();

  virtual void start() override;
  virtual void stop() override;
  virtual void resume() override;
  virtual void pause() override;
  virtual void sendVideoData(const uint8_t *data, const uint32_t size, const uint32_t timestamp) override;
  virtual void sendAudioData(const uint8_t *data, const uint32_t size, const uint32_t timestamp) override;

private:
  MediasoupClient mMediasoupClient;
};
