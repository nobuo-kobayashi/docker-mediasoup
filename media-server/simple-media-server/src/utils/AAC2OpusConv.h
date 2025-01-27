#pragma once

#include "../codec/aac/AudioSpecificConfig.h"
#include "../codec/aac/AACDecoder.h"
#include "../codec/opus/OpusEncoder.h"
#include <functional>
#include <vector>

class AAC2OpusConv {
public:
  typedef std::function<void(const uint8_t *data, uint32_t size)> CallbackFunction;

private:
  SimpleAACDecoder mDecoder;
  SimpleOpusEncoder mEncoder;
  std::vector<int16_t> mBuf;
  uint32_t mSampleRate;
  uint8_t mChannels;

  void initAACRawDecoder(const uint8_t *ascData, uint32_t ascDataLen);
  void initOpusEncoder(uint32_t sampleRate, uint8_t channels);
  int32_t decode(const uint8_t *inBuffer, uint32_t inBufferSize);
  int32_t encode(uint8_t *outBuffer, uint32_t maxOutBufferSize);

public:
  AAC2OpusConv();
  virtual ~AAC2OpusConv();

  void init(AudioSpecificConfig *config);
  int32_t conv(const uint8_t *inBuffer, uint32_t inBufferSize, CallbackFunction callback);
  void destroy();
};
