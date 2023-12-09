#pragma once

#include <string>

class PlainTransport {
public:
  std::string id;
  std::string ip;
  int port;
  int rtcpPort;
};