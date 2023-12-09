#include "RTPSender.h"

RTPSender::RTPSender()
{
  mDestIP[0] = 127;
  mDestIP[1] = 0;
  mDestIP[2] = 0;
  mDestIP[3] = 1;
  mDestPort = 6664;
  mPortBase = 0;
  mMark = false;
}

RTPSender::~RTPSender()
{
  close();
}

int RTPSender::getLocalSSRC()
{
  return mSession.GetLocalSSRC();
}

bool RTPSender::isActive()
{
  return mSession.IsActive();
}

void RTPSender::setPayloadType(uint8_t type)
{
  mPayloadType = type;
}

void RTPSender::setDestPort(int port)
{
  mDestPort = port;
}

void RTPSender::setPortBase(int port)
{
  mPortBase = port;
}

void RTPSender::setFrequency(double freq)
{
  mFrequency = freq;
}

void RTPSender::setTimestampIncrement(uint32_t increment)
{
  mTimestampIncrement = increment;
}

void RTPSender::setMark(bool m)
{
  mMark = m;
}

void RTPSender::setDestIPAddress(std::string& ipaddress)
{
  std::istringstream iss(ipaddress);
  std::string token;
  int index = 0;
  while (getline(iss, token, '.')) {
    mDestIP[index++] = atoi(token.c_str());
    if (index >= 4) {
      break;
    }
  }
  if (index != 4) {
    LOG_WARN("Invalid IP address. ipaddress=%s\n", ipaddress.c_str());
  }
}

void RTPSender::open()
{
  LOG_DEBUG("RTPSender is opened.\n");
  LOG_DEBUG("    JRTPLIB Version: %s\n",RTPLibraryVersion::GetVersion().GetVersionString().c_str());
  LOG_DEBUG("    destIP=%d.%d.%d.%d:%d\n", mDestIP[0],mDestIP[1],mDestIP[2],mDestIP[3],mDestPort);
 
  RTPSessionParams sessParams;
  sessParams.SetAcceptOwnPackets(false);
  sessParams.SetOwnTimestampUnit(1.0/mFrequency);
  sessParams.SetUsePredefinedSSRC(false);

  RTPUDPv4TransmissionParams transparams;
  transparams.SetPortbase(mPortBase);

  int status = mSession.Create(sessParams, &transparams);
  if (status < 0) {
    LOG_ERROR("Failed to create a RTPSession. status=%d error=%s\n", status, RTPGetErrorString(status).c_str());
    return;
  }

  RTPIPv4Address addr(mDestIP, mDestPort);
  status = mSession.AddDestination(addr);
  if (status < 0) {
    LOG_ERROR("Failed to add a destination. status=%d error=%s\n", status, RTPGetErrorString(status).c_str());
    return;
  }

  mSession.SetDefaultTimestampIncrement(mTimestampIncrement);
  mSession.SetDefaultPayloadType(mPayloadType);
  mSession.SetDefaultMark(mMark);
  mSession.SetMaximumPacketSize(MAXLEN + 100);
}

void RTPSender::close()
{
  mSession.BYEDestroy(RTPTime(10, 0), 0, 0);
}
