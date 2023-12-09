#include "H264RTPSender.h"

// see https://tex2e.github.io/rfc-translater/html/rfc3984.html

H264RTPSender::H264RTPSender()
{
  mFps = 30;
  mPayloadType = 96;
  mFrequency = 90000.0;
  mTimestampIncrement = (uint32_t)mFrequency / mFps;
}

H264RTPSender::~H264RTPSender()
{
}

// TODO: OBS の 出力設定で、tune に zerolatency を設定すると映像が乱れてしまう。

void H264RTPSender::send(const char *data, const uint32_t dataLen)
{
  if (dataLen <= MAXLEN - 2) {
    sendSingleNalUnitPacket(data, dataLen);
  } else {
    sendFragmentationUnitsPacket(data, dataLen);
  }
}

// Single Nal Unit
// 0                   1                   2                   3
// 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// |F|NRI|  Type   |                                               |
// +-+-+-+-+-+-+-+-+                                               |
// |                                                               |
// |               Bytes 2..n of a single NAL unit                 |
// |                                                               |
// |                               +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// |                               :...OPTIONAL RTP padding        |
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

void H264RTPSender::sendSingleNalUnitPacket(const char *data, const uint32_t dataLen)
{
  unsigned char naluHeader = data[0];
  unsigned char naluType = naluHeader & 0x1F;
  bool mark = (naluType <= 5);

  int status = mSession.SendPacket(data, dataLen, mPayloadType, mark, mark ? mTimestampIncrement : 0);
  if (status < 0) {
    LOG_ERROR("Failed to send a message.\n");
    return;
  }
}

// Fragmentation Units (FUs)
// 0                   1                   2                   3
// 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// | FU indicator  |   FU header   |               DON             |
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-|
// |                                                               |
// |                         FU payload                            |
// |                                                               |
// |                               +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// |                               :...OPTIONAL RTP padding        |
// +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

// | FU indicator  | FU Header     |
// +---------------+---------------+
// |0|1|2|3|4|5|6|7|0|1|2|3|4|5|6|7|
// +-+-+-+-+-+-+-+-+---------------+
// |F|NRI|  Type   |S|E|R|  Type   |
// +---------------+---------------+

void H264RTPSender::sendFragmentationUnitsPacket(const char *data, const uint32_t dataLen)
{
  unsigned char naluHeader = data[0];
  unsigned int rtpLen = dataLen - 1;

  unsigned char rtpBuf[MAXLEN + 100];
  unsigned int pi = 0;
  unsigned int num = rtpLen / MAXLEN;
  unsigned int more = rtpLen % MAXLEN;
  if (more == 0) {
    num -= 1;
    more = MAXLEN;
  }

  unsigned char fuIndicator = naluHeader & 0xE0;
  fuIndicator |= 0x1C;

  unsigned char fuHeader = naluHeader & 0x1F;

  while(pi <= num) {
    if (pi == 0) {
      // 開始
      fuHeader |= 0x80;    // bit 7  S
      fuHeader &= ~0x40;   // bit 6  E
      fuHeader &= ~0x20;   // bit 5  R

      rtpBuf[0] = fuIndicator;
      rtpBuf[1] = fuHeader;
      memcpy(&rtpBuf[2], &data[1], MAXLEN);

      int status = mSession.SendPacket(rtpBuf, MAXLEN + 2, mPayloadType, false, 0);
      if (status < 0) {
        LOG_ERROR("Failed to send a start message.\n");
        return;
      }
    } else if (pi == num) {
      // 終了
      fuHeader &= ~0x80;    // bit 7  S
      fuHeader |= 0x40;     // bit 6  E
      fuHeader &= ~0x20;    // bit 5  R

      rtpBuf[0] = fuIndicator;
      rtpBuf[1] = fuHeader;
      memcpy(&rtpBuf[2], &data[1 + pi * MAXLEN], more);

      int status = mSession.SendPacket(rtpBuf, more + 2, mPayloadType, true, mTimestampIncrement);
      if (status < 0) {
        LOG_ERROR("Failed to send a end message.\n");
        return;
      }
    } else {
      fuHeader &= ~0x80;    // bit 7  S
      fuHeader &= ~0x40;    // bit 6  E
      fuHeader &= ~0x20;    // bit 5  R

      rtpBuf[0] = fuIndicator;
      rtpBuf[1] = fuHeader;
      memcpy(&rtpBuf[2], &data[1 + pi * MAXLEN], MAXLEN);

      int status = mSession.SendPacket(rtpBuf, MAXLEN + 2, mPayloadType, false, 0);
      if (status < 0) {
        LOG_ERROR("Failed to send a middle message.\n");
        return;
      }
    }
    pi++;
  }
}
