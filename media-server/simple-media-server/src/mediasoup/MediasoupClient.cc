#include "MediasoupClient.h"

MediasoupClient::MediasoupClient()
{
}

MediasoupClient::~MediasoupClient()
{
  disconnect();
}

void MediasoupClient::connect(std::string uri, std::string origin)
{
  mWebsocketClient.setListener(this);
  mWebsocketClient.connectAsync(uri, origin);
}

void MediasoupClient::disconnect()
{
  mWebsocketClient.disconnect();
}

void MediasoupClient::createNextProducer()
{
  if (!mWebsocketClient.isConnected()) {
    return;
  }

  if (mCreatingProducers.empty()) {
    return;
  }

  requestPlainRtpTransport();
}

void MediasoupClient::requestPlainRtpTransport()
{
  json j = json{
    {"type", "createSendPlainTransport"},
    {"payload", json{
      {"rtcpMux", false},
      {"comedia", true}
    }}
  };

  std::string msg = j.dump();
  mWebsocketClient.sendMessage(msg);
}

void MediasoupClient::requestCreateProducer(std::string id, std::string kind, json rtpParameters)
{
  json j = json{
    {"type", "produce"},
    {"payload", json{
      {"id", id},
      {"parameters", json{
        {"kind", kind},
        {"rtpParameters", rtpParameters},
        {"appData", json{
          {"name", "test"},
        }}
      }}
    }}
  };

  std::string msg = j.dump();
  mWebsocketClient.sendMessage(msg);
}

void MediasoupClient::createMediaProducer(std::shared_ptr<StreamInfo> info)
{
  if (!info->videoInfo.enabled && !info->audioInfo.enabled) {
    return;
  }

  std::shared_ptr<MediaProducer> producer = std::make_shared<MediaProducer>(info);
  mProducerMap.add(info->streamKey, producer);
  mCreatingProducers.push(producer);
  createNextProducer();
}

void MediasoupClient::sendVideoData(std::string streamKey, const char *data, const uint32_t size)
{
  std::shared_ptr<MediaProducer> producer = mProducerMap.get(streamKey);
  if (producer) {
    producer->sendVideo(data, size);
  }
}

void MediasoupClient::sendAudioData(std::string streamKey, const char *data, const uint32_t size)
{
  std::shared_ptr<MediaProducer> producer = mProducerMap.get(streamKey);
  if (producer) {
    producer->sendAudio(data, size);
  }
}

void MediasoupClient::pause(std::string streamKey)
{
  std::shared_ptr<MediaProducer> producer = mProducerMap.get(streamKey);
  if (producer) {
    {
      json j = json{
        {"type", "pauseProducer"},
        {"payload", json{
          {"producerId", producer->video.id}
        }}
      };
      std::string msg = j.dump();
      mWebsocketClient.sendMessage(msg);
    }
    {
      json j = json{
        {"type", "pauseProducer"},
        {"payload", json{
          {"producerId", producer->audio.id}
        }}
      };
      std::string msg = j.dump();
      mWebsocketClient.sendMessage(msg);
    }
  }
}

void MediasoupClient::resume(std::string streamKey)
{
  std::shared_ptr<MediaProducer> producer = mProducerMap.get(streamKey);
  if (producer) {
    {
      json j = json{
        {"type", "resumeProducer"},
        {"payload", json{
          {"producerId", producer->video.id}
        }}
      };
      std::string msg = j.dump();
      mWebsocketClient.sendMessage(msg);
    }
    {
      json j = json{
        {"type", "resumeProducer"},
        {"payload", json{
          {"producerId", producer->audio.id}
        }}
      };
      std::string msg = j.dump();
      mWebsocketClient.sendMessage(msg);
    }
  }
}

void MediasoupClient::onMediasoupSendPlainTransport(json& payload)
{
  std::string id = payload["id"].get<std::string>();
  std::string ip = payload["ip"].get<std::string>();
  int port = payload["port"].get<int>();
  int rtcpPort = payload["rtcpPort"].get<int>();

  std::shared_ptr<MediaProducer> producer = mCreatingProducers.front();
  switch (producer->state) {
    case CreatingVideo:
    {
      producer->video.id = id;
      producer->video.ip = ip;
      producer->video.port = port;
      producer->video.rtcpPort = rtcpPort;
      producer->openVideo();

      json rtpParameters = json{
        {"codecs", json{
          json{
            {"mimeType", producer->info->videoInfo.codec.mimeType},
            {"payloadType", producer->info->videoInfo.codec.payloadType},
            {"clockRate", producer->info->videoInfo.codec.clockRate},
            {"parameters", json{
              {"packetization-mode", 1},
              {"profile-level-id", "42e01f"},
              {"level-asymmetry-allowed", 1}
            }}
          }
        }},
        {"encodings", json{
          json{
            {"ssrc", producer->getVideoSenderSSRC()}
          }
        }}
      };

      requestCreateProducer(id, "video", rtpParameters);
    }
      break;
    case CreatingAudio:
    {
      producer->audio.id = id;
      producer->audio.ip = ip;
      producer->audio.port = port;
      producer->audio.rtcpPort = rtcpPort;
      producer->openAudio();

      json rtpParameters = json{
        {"codecs", json{
          json{
            {"mimeType", producer->info->audioInfo.codec.mimeType},
            {"payloadType", producer->info->audioInfo.codec.payloadType},
            {"clockRate", producer->info->audioInfo.codec.clockRate},
            {"channels", producer->info->audioInfo.codec.channels},
            {"parameters", json{
              {"sprop-stereo", producer->info->audioInfo.codec.stereo}
            }}
          }
        }},
        {"encodings", json{
          json{
            {"ssrc", producer->getAudioSenderSSRC()}
          }
        }}
      };

      requestCreateProducer(id, "audio", rtpParameters);
    }
      break;
    default:
      break;
  }
}

void MediasoupClient::onMediasoupProducer(json& payload)
{
  std::shared_ptr<MediaProducer> producer = mCreatingProducers.front();
  switch (producer->state) {
    case CreatingVideo:
    {
      if (producer->info->audioInfo.enabled) {
        producer->state = CreatingAudio;
        requestPlainRtpTransport();
      } else {
        producer->state = Created;
        mCreatingProducers.pop();
        createNextProducer();
      }
    }
      break;
    case CreatingAudio:
    {
      producer->state = Created;
      mCreatingProducers.pop();
      createNextProducer();
    }
      break;
    default:
      LOG_WARN("MediaProducer state is unknown. state=%d\n", producer->state);
      break;
  }
}

// WebsocketClientListener implements.

void MediasoupClient::onConnected(WebsocketClient *client)
{
  LOG_INFO("Connected to mediasoup.\n");
  createNextProducer();
}

void MediasoupClient::onDisconnected(WebsocketClient *client)
{
  LOG_INFO("Disconnected to mediasoup.\n");
  mProducerMap.clear();
}

void MediasoupClient::onFailedToConnect(WebsocketClient *client)
{
  LOG_ERROR("Failed to connect to mediasoup.\n");
}

void MediasoupClient::onMessage(WebsocketClient *client, std::string& message)
{
  const char *text = message.c_str();
  if (text) {
    json j = json::parse(text);
    if (j.find("type") != j.end() && j.find("payload") != j.end()) {
      auto type = j["type"].get<std::string>();
      auto payload = j["payload"].get<json>();
      if (type.compare("sendPlainTransport") == 0) {
        onMediasoupSendPlainTransport(payload);
      } else if (type.compare("producer") == 0) {
        onMediasoupProducer(payload);
      } else {
        LOG_WARN("Unknown type. type=%s\n", type.c_str());
      }      
    } else {
      LOG_WARN("type or payload not found. json=%s\n", text);
    }
  }
}
