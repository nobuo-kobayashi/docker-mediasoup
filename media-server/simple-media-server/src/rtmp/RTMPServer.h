#pragma once

#include <stdio.h>
#include <stdlib.h>
#include <string>
#include <vector>

#include "../utils/BaseThread.h"
#include "../utils/Log.h"
#include "../utils/SafeMap.h"

#include "RTMPClient.h"

typedef enum {
  SERVER_ACCEPTING,
  SERVER_IN_PROGRESS,
  SERVER_STOPPING,
  SERVER_STOPPED
} ServerState;

class RTMPServer;

class RTMPServerListener {
public:
  virtual bool onStreamKey(RTMPServer *server, std::string streamKey) { return true; }
  virtual void onClosed(RTMPServer *server, std::string streamKey) {}
  virtual void onReceivedVideoConfig(RTMPServer *server, std::string streamKey, AVCDecoderConfigurationRecord *config) {}
  virtual void onReceivedAudioConfig(RTMPServer *server, std::string streamKey, AudioSpecificConfig *config) {}
  virtual void onReceivedVideoData(RTMPServer *server, std::string streamKey, const char *data, const uint32_t size) {}
  virtual void onReceivedAudioData(RTMPServer *server, std::string streamKey, const char *data, const uint32_t size) {}
};

class RTMPServer : public BaseThread, public RTMPClientListener {
private:
  ServerState mServState;
  std::string mServAddress;
  int mServPort;
  int mServSockfd;
  void *mSslCtx;

  RTMPServerListener *mListener;
  SafeMap<int, std::shared_ptr<RTMPClient>> mConnectingStreamMap;
  SafeMap<std::string, std::shared_ptr<RTMPClient>> mStreamMap;

protected:
  virtual void runThread() override;

public:
  RTMPServer();
  virtual ~RTMPServer();

  void useSSL(std::string certfile, std::string keyfile);
  bool listen(int port = 1935);
  void shutdown();

  ServerState getState();

  void setListener(RTMPServerListener *listener) {
    mListener = listener;
  }

  // RTMPClientListener implements.
  virtual bool onStreamKey(RTMPClient *client, std::string streamKey) override;
  virtual void onClosed(RTMPClient *client) override;
  virtual void onReceivedVideoConfig(RTMPClient *client, AVCDecoderConfigurationRecord *config) override;
  virtual void onReceivedAudioConfig(RTMPClient *client, AudioSpecificConfig *config) override;
  virtual void onReceivedVideoData(RTMPClient *client, const char *data, uint32_t size, uint32_t timestamp) override;
  virtual void onReceivedAudioData(RTMPClient *client, const char *data, uint32_t size, uint32_t timestamp) override;
};
