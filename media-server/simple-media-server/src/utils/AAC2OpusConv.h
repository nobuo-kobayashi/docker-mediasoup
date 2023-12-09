#pragma once

#include "../codec/aac/AudioSpecificConfig.h"
#include "../codec/aac/AACDecoder.h"
#include "../codec/opus/OpusEncoder.h"
#include <vector>

class AAC2OpusConv {
private:
  SimpleAACDecoder mDecoder;
  SimpleOpusEncoder mEncoder;
  std::vector<int16_t> mBuf;
  uint32_t mSampleRate;
  uint8_t mChannels;

public:
  AAC2OpusConv();
  virtual ~AAC2OpusConv();

  void init(AudioSpecificConfig *config);
  void initAACRawDecoder(const uint8_t *ascData, uint32_t ascDataLen);
  void initOpusEncoder(uint32_t sampleRate, uint8_t channels);
  int32_t decode(const uint8_t *inBuffer, uint32_t inBufferSize);
  int32_t encode(uint8_t *outBuffer, uint32_t maxOutBufferSize);
  void destroy();
};
