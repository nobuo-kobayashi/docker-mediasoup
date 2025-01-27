#pragma once

#include "MediaInput.h"
#include "../rtmp/RTMPServer.h"
#include "../utils/AAC2OpusConv.h"

class RTMPInput : public MediaInput, public RTMPServerListener {
public:
  RTMPInput(Settings &settings);
  virtual ~RTMPInput();

  // RTMPServerListener implements.
  virtual bool onStreamKey(RTMPServer *server, std::string streamKey) override;
  virtual void onClosed(RTMPServer *server, std::string streamKey) override;
  virtual void onReceivedVideoConfig(RTMPServer *server, std::string streamKey, AVCDecoderConfigurationRecord *config) override;
  virtual void onReceivedAudioConfig(RTMPServer *server, std::string streamKey, AudioSpecificConfig *config) override;
  virtual void onReceivedVideoData(RTMPServer *server, std::string streamKey, const uint8_t *data, const uint32_t size, uint32_t timestamp) override;
  virtual void onReceivedAudioData(RTMPServer *server, std::string streamKey, const uint8_t *data, const uint32_t size, uint32_t timestamp) override;

  // MediaInput implements
  virtual void start() override;
  virtual void stop() override;

private:
  RTMPServer mRtmpServer;
  AAC2OpusConv mConv;
};
