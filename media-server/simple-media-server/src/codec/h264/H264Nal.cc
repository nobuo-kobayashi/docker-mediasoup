#include "H264Nal.h"

void H264NALUnitParser::parse(const uint8_t *data, uint32_t dataLen, AVCDecoderConfigurationRecord *avcConfig, CallbackFunction callback)
{
  const uint8_t *nalBytes = data;
  size_t nalByteSize = dataLen;
  uint32_t index = 0;
  int NALUnitLen = avcConfig->lengthSizeMinusOne + 1;

  // NAL Unit ごとに分解して、リスナーに通知します。
  while (index < nalByteSize) {
    uint32_t NALUnitSize = 0;
    for (int i = 0; i < NALUnitLen; i++) {
      NALUnitSize <<= 8;
      NALUnitSize |= (nalBytes[index++] & 0xFF);
    }

    callback(&nalBytes[index], NALUnitSize);

    index += NALUnitSize;
  }
}
