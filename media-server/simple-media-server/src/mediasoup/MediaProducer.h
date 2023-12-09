#pragma once

#include <memory>

#include "../rtp/RTPSender.h"
#include "../utils/Log.h"
#include "../StreamInfo.h"
#include "PlainTransport.h"

typedef enum {
  None,
  CreatingVideo,
  CreatingAudio,
  Created
} MediaProducerState;

class MediaProducer {
private:
  std::shared_ptr<RTPSender> mVideoSender;
  std::shared_ptr<RTPSender> mAudioSender;

public:
  std::shared_ptr<StreamInfo> info;
  MediaProducerState state;
  PlainTransport video;
  PlainTransport audio;

public:
  MediaProducer(std::shared_ptr<StreamInfo> info);
  virtual ~MediaProducer();

  void openVideo();
  void openAudio();

  int getVideoSenderSSRC();
  int getAudioSenderSSRC();

  void closeVideo();
  void closeAudio();

  void sendVideo(const char *data, const uint32_t size);
  void sendAudio(const char *data, const uint32_t size);
};
