#pragma once

#include <vector>
#include <string>

class NetworkUtils {
private:
  NetworkUtils() {}
  ~NetworkUtils() {}

  static bool IsNumber(const std::string& str);
  static std::vector<std::string> Split(const std::string& str, const char delim);

public:
  static bool ValidateIP(std::string& ip);
  static bool GetIPAddressFromHostName(std::string& hostname);
  static bool GetIPAddress(int sockfd, char *dest);
};