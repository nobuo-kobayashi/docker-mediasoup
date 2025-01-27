#include "OpusRTPSender.h"

// see https://tex2e.github.io/rfc-translater/html/rfc7587.html

OpusRTPSender::OpusRTPSender()
{
  mPayloadType = 100;
  mFrequency = 48000.0;
  // Opus のフレームサイズに基づいてタイムスタンプを増加 (20ms frame at 48kHz)
  mTimestampIncrement = (uint32_t) mFrequency * 0.02;
}

OpusRTPSender::~OpusRTPSender()
{
}

void OpusRTPSender::send(const uint8_t *data, const uint32_t dataLen)
{
  int status = mSession.SendPacket(data, dataLen, mPayloadType, true, mTimestampIncrement);
  if (status < 0) {
    LOG_ERROR("Failed to send a opus rtp packet. dstIP=%d.%d.%d.%d:%d\n", mDestIP[0],mDestIP[1],mDestIP[2],mDestIP[3],mDestPort);
    return;
  }
}
