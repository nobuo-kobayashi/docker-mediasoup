#pragma once

#include <memory>
#include <string>
#include <vector>

#include "StreamInfo.h"
#include "utils/Log.h"

class Settings {
public:
  std::string name;

  // RTMP サーバ情報
  int port;
  std::string certFile;
  std::string keyFile;

  // mediasoup 情報
  std::string ws;
  std::string origin;

  std::vector<std::shared_ptr<StreamInfo>> streamInfoList;
};

class SettingsLoader {
private:
  SettingsLoader() {}
  ~SettingsLoader() {}

public:
  static void load(std::string& filePath, Settings *settings);
  static void print(Settings *settings);
};