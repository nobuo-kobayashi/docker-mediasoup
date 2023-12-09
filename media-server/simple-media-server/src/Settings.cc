#include "Settings.h"
#include <fstream>
#include <iostream>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

void SettingsLoader::load(std::string& filePath, Settings *settings)
{
  std::ifstream i(filePath);
  json j;
  i >> j;

  settings->port = 1935;
  settings->ws = "wss://mediasoup:3000";
  settings->origin = "localhost";

  if (j.find("rtmp-server") != j.end()) {
    auto rtmpserver = j["rtmp-server"];
    settings->port = rtmpserver["port"].get<int>();
    if (rtmpserver.find("certfile") != rtmpserver.end()) {
      settings->certFile = rtmpserver["certfile"].get<std::string>();
    }
    if (rtmpserver.find("keyfile") != rtmpserver.end()) {
      settings->keyFile = rtmpserver["keyfile"].get<std::string>();
    }
  }

  if (j.find("mediasoup") != j.end()) {
    auto mediasoup = j["mediasoup"];
    if (mediasoup.find("ws") != mediasoup.end()) {
      settings->ws = mediasoup["ws"].get<std::string>();
    }
    if (mediasoup.find("origin") != mediasoup.end()) {
      settings->origin = mediasoup["origin"].get<std::string>();
    }
  }

  if (j.find("streamers") != j.end()) {
    auto streamers = j["streamers"];
    for (json::iterator it = streamers.begin(); it != streamers.end(); ++it) {
      json streamer = *it;
      std::shared_ptr<StreamInfo> info = std::make_shared<StreamInfo>();
      if (streamer.find("streamKey") != streamer.end()) {
        info->streamKey = streamer["streamKey"].get<std::string>();

        if (streamer.find("video") != streamer.end()) {
          auto video = streamer["video"];
          if (video.find("codec") != video.end()) {
            auto codec = video["codec"];
            info->videoInfo.enabled = true;
            info->videoInfo.codec.mimeType = codec["mimeType"].get<std::string>();
            info->videoInfo.codec.payloadType = codec["payloadType"].get<int>();
            info->videoInfo.codec.clockRate = codec["clockRate"].get<int>();
          }
        }

        if (streamer.find("audio") != streamer.end()) {
          auto audio = streamer["audio"];
          if (audio.find("codec") != audio.end()) {
            auto codec = audio["codec"];
            info->audioInfo.enabled = true;
            info->audioInfo.codec.mimeType = codec["mimeType"].get<std::string>();
            info->audioInfo.codec.payloadType = codec["payloadType"].get<int>();
            info->audioInfo.codec.clockRate = codec["clockRate"].get<int>();
            info->audioInfo.codec.channels = codec["channels"].get<int>();
            if (codec.find("parameters") != codec.end()) {
              auto parameters = codec["parameters"];
              info->audioInfo.codec.stereo = parameters["sprop-stereo"].get<int>();
            }
          }
        }

        settings->streamInfoList.push_back(info);
      }
    }
  }
}


void SettingsLoader::print(Settings *settings)
{
  LOG_INFO("------------------------------------\n");
  LOG_INFO("Mediasoup websocket url: %s\n", settings->ws.c_str());
  LOG_INFO("origin: %s\n", settings->origin.c_str());
  LOG_INFO("------------------------------------\n");
  LOG_INFO("RTMP Port: %d\n", settings->port);
  LOG_INFO("StreamKey:\n");
  for (auto info : settings->streamInfoList) {
    LOG_INFO("  - %s\n", info->streamKey.c_str());
  }
  LOG_INFO("------------------------------------\n");
}