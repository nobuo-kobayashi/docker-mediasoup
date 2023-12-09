#include "NetworkUtils.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <netdb.h>
#include <iostream>
#include <linux/netfilter_ipv4.h>
#include <arpa/inet.h>

bool NetworkUtils::IsNumber(const std::string &str)
{
  return !str.empty() && (str.find_first_not_of("[0123456789]") == std::string::npos);
}

std::vector<std::string> NetworkUtils::Split(const std::string& str, const char delim)
{
  auto i = 0;
  std::vector<std::string> list;

  auto pos = str.find(delim);
  while (pos != std::string::npos) {
    list.push_back(str.substr(i, pos - i));
    i = ++pos;
    pos = str.find(delim, pos);
  }

  list.push_back(str.substr(i, str.length()));

  return list;
}

bool NetworkUtils::ValidateIP(std::string& ip)
{
  std::vector<std::string> list = Split(ip, '.');
  if (list.size() != 4) {
    return false;
  }
  for (std::string str: list) {
    if (!IsNumber(str) || stoi(str) > 255 || stoi(str) < 0) {
      return false;
    }
  }
  return true;
}

bool NetworkUtils::GetIPAddressFromHostName(std::string& hostname)
{
  struct hostent *he;
  if ((he = gethostbyname(hostname.c_str())) == nullptr) {
    return false;
  }
  return true;
}

bool NetworkUtils::GetIPAddress(int sockfd, char *destch)
{
  struct sockaddr_in dest;
  socklen_t destlen = sizeof(struct sockaddr_in);
  if (getsockopt(sockfd, SOL_IP, SO_ORIGINAL_DST, &dest, &destlen) == -1) {
    return false;
  }
  strcpy(destch, inet_ntoa(dest.sin_addr));
  return true;
}