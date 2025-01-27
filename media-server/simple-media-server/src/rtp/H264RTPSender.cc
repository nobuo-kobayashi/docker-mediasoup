#include "H264RTPSender.h"
#include <thread>
#include <chrono>

// see https://tex2e.github.io/rfc-translater/html/rfc3984.html

H264RTPSender::H264RTPSender()
{
  mPayloadType = 96;
  mFps = 30;
  mFrequency = 90000.0;
  mTimestampIncrement = static_cast<uint32_t>((1.0 / mFps) * mFrequency);
}

H264RTPSender::~H264RTPSender()
{
}

// TODO: OBS の 出力設定で、tune に zerolatency を設定すると映像が乱れてしまう。

void H264RTPSender::send(const uint8_t *data, const uint32_t dataLen)
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

void H264RTPSender::sendSingleNalUnitPacket(const uint8_t *data, const uint32_t dataLen)
{
  uint8_t naluHeader = data[0];
  uint32_t naluType = naluHeader & 0x1F;
  bool mark = (naluType <= 5);
  int status = mSession.SendPacket(data, dataLen, mPayloadType, mark, mark ? mTimestampIncrement : 0);
  if (status < 0) {
    LOG_ERROR("Failed to send Nal unit packet.\n");
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

void H264RTPSender::sendFragmentationUnitsPacket(const uint8_t *data, const uint32_t dataLen)
{
  uint8_t naluHeader = data[0];
  uint32_t rtpLen = dataLen - 1;

  uint8_t rtpBuf[MAXLEN + 100];
  uint32_t pi = 0;
  uint32_t num = rtpLen / MAXLEN;
  uint32_t more = rtpLen % MAXLEN;

  if (more == 0) {
    num -= 1;
    more = MAXLEN;
  }

  uint8_t fuIndicator = (naluHeader & 0xE0) | 0x1C;

  while (pi <= num) {
    uint8_t fuHeader = naluHeader & 0x1F;
    if (pi == 0) {
      // 最初のフラグメント
      fuHeader |= 0x80;
      rtpBuf[0] = fuIndicator;
      rtpBuf[1] = fuHeader;
      memcpy(&rtpBuf[2], &data[1], MAXLEN);

      int status = mSession.SendPacket(rtpBuf, MAXLEN + 2, mPayloadType, false, 0);
      if (status < 0) {
        LOG_ERROR("Failed to send start of h264 RTP packet. Status code: %d\n", status);
        return;
      }
    } else if (pi == num) {
      // 最後のフラグメント
      fuHeader |= 0x40;
      rtpBuf[0] = fuIndicator;
      rtpBuf[1] = fuHeader;
      memcpy(&rtpBuf[2], &data[1 + pi * MAXLEN], more);

      int status = mSession.SendPacket(rtpBuf, more + 2, mPayloadType, true, mTimestampIncrement);
      if (status < 0) {
        LOG_ERROR("Failed to send end of h264 RTP packet. Status code: %d\n", status);
        return;
      }
    } else {
      // 中間のフラグメント
      rtpBuf[0] = fuIndicator;
      rtpBuf[1] = fuHeader;
      memcpy(&rtpBuf[2], &data[1 + pi * MAXLEN], MAXLEN);

      int status = mSession.SendPacket(rtpBuf, MAXLEN + 2, mPayloadType, false, 0);
      if (status < 0) {
        LOG_ERROR("Failed to send middle of h264 RTP packet. Status code: %d\n", status);
        return;
      }
    }

    pi++;
  }
}
