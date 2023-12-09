#pragma once

#include <stdint.h>
#include <opus/opus.h>

class SimpleOpusEncoder {
private:
  OpusEncoder *mEncoder;
  uint32_t mBitrate;
  uint32_t mSampleRate;
  uint8_t mChannels;

public:
  SimpleOpusEncoder();
  virtual ~SimpleOpusEncoder();

  void initialize(uint32_t sampleRate, uint8_t channels);
  void setBitrate(uint32_t bitrate);
  int32_t encode(opus_int16 *inFrame, uint32_t inFrameSize, uint8_t *outBuffer, uint32_t maxOutBufferSize);
  void destroy();
};