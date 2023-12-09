#pragma once

#include <nlohmann/json.hpp>

#include "../utils/Log.h"
#include "../utils/SafeMap.h"
#include "../utils/SafeQueue.h"
#include "../utils/WebsocketClient.h"
#include "../Settings.h"
#include "MediaProducer.h"

using json = nlohmann::json;

class MediasoupClient;

class MediasoupClientListener {
public:
  virtual void onConnected(MediasoupClient *server) {}
  virtual void onFailedToConnect(MediasoupClient *server) {}
  virtual void onDisconnected(MediasoupClient *server) {}
};

class MediasoupClient : public WebsocketClientListener {
private:
  WebsocketClient mWebsocketClient;
  SafeQueue<std::shared_ptr<MediaProducer>> mCreatingProducers;
  SafeMap<std::string, std::shared_ptr<MediaProducer>> mProducerMap;

private:
  void createNextProducer();
  void requestPlainRtpTransport();
  void requestCreateProducer(std::string id, std::string kind, json rtpParameters);

  void onMediasoupSendPlainTransport(json& payload);
  void onMediasoupProducer(json& payload);

public:
  MediasoupClient();
  virtual ~MediasoupClient();

  void connect(std::string uri, std::string origin);
  void disconnect();

  void createMediaProducer(std::shared_ptr<StreamInfo> info);

  void sendVideoData(std::string streamKey, const char *data, const uint32_t size);
  void sendAudioData(std::string streamKey, const char *data, const uint32_t size);

  void pause(std::string streamKey);
  void resume(std::string streamKey);

  // WebsocketClientListener implements.
  virtual void onConnected(WebsocketClient *client) override;
  virtual void onDisconnected(WebsocketClient *client) override;
  virtual void onFailedToConnect(WebsocketClient *client) override;
  virtual void onMessage(WebsocketClient *client, std::string& message) override;
};