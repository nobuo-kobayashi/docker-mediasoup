#pragma once

#include "Settings.h"
#include "rtmp/RTMPServer.h"
#include "mediasoup/MediasoupClient.h"

class MediaServer : public RTMPServerListener {
private:
  Settings mSettings;
  MediasoupClient mMediasoupClient;
  RTMPServer mRtmpServer;

public:
  MediaServer(Settings& settings);
  virtual ~MediaServer();

  void process();

  // RTMPServerListener implements.
  virtual bool onStreamKey(RTMPServer *server, std::string streamKey) override;
  virtual void onClosed(RTMPServer *server, std::string streamKey) override;
  virtual void onReceivedVideoConfig(RTMPServer *server, std::string streamKey, AVCDecoderConfigurationRecord *config) override;
  virtual void onReceivedAudioConfig(RTMPServer *server, std::string streamKey, AudioSpecificConfig *config) override;
  virtual void onReceivedVideoData(RTMPServer *server, std::string streamKey, const char *data, const uint32_t size) override;
  virtual void onReceivedAudioData(RTMPServer *server, std::string streamKey, const char *data, const uint32_t size) override;
};
