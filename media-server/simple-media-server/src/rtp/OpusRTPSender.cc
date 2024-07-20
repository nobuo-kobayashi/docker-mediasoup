#include "OpusRTPSender.h"

// see https://tex2e.github.io/rfc-translater/html/rfc7587.html

OpusRTPSender::OpusRTPSender()
{
  mPayloadType = 100;
  mFrequency = 48000.0;
  // Open のフレームサイズを 960 にしているので、ここでも 960 にしておきます。
  mTimestampIncrement = 960;
}

OpusRTPSender::~OpusRTPSender()
{
}

void OpusRTPSender::send(const char *data, const uint32_t dataLen)
{
  int status = mSession.SendPacket(data, dataLen, mPayloadType, true, mTimestampIncrement);
  if (status < 0) {
    LOG_ERROR("Failed to send a opus rtp packet. dstIP=%d.%d.%d.%d:%d\n", mDestIP[0],mDestIP[1],mDestIP[2],mDestIP[3],mDestPort);
    return;
  }
}
