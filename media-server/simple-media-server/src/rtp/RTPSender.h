#pragma once

#include <jrtplib3/rtpsession.h>
#include <jrtplib3/rtpudpv4transmitter.h>
#include <jrtplib3/rtpipv4address.h>
#include <jrtplib3/rtpsessionparams.h>
#include <jrtplib3/rtperrors.h>
#include <jrtplib3/rtplibraryversion.h>
#include <iostream>
#include <string>
#include <sstream>

#include "../utils/Log.h"

using namespace jrtplib;

#define RTP_HEADER_LEN 12

#define MAXLEN (RTP_DEFAULTPACKETSIZE - 100 - RTP_HEADER_LEN)

class RTPSender {
protected:
  RTPSession mSession;
  uint8_t mPayloadType;
  uint8_t mDestIP[4];
  uint16_t mDestPort;
  uint16_t mPortBase;
  double mFrequency;
  uint32_t mTimestampIncrement;
  bool mMark;

public:
  RTPSender();
  virtual ~RTPSender();

  void setDestIPAddress(std::string& ipaddress);
  void setPayloadType(uint8_t type);
  void setDestPort(int port);
  // 0 を指定することで自動でポートを指定します。
  // RTPUDPv4TransmissionParams::SetAllowOddPortbase が呼び出されない限り、これは偶数である必要があります。
  void setPortBase(int port);
  void setFrequency(double freq);
  void setTimestampIncrement(uint32_t increment);
  void setMark(bool m);
  int getLocalSSRC();
  bool isActive();

  virtual void open();
  virtual void close();
  virtual void send(const char *data, const uint32_t dataLen) = 0;
};
