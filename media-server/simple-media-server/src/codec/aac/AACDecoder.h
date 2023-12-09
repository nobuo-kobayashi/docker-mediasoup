#pragma once

#include <stdint.h>
#include <fdk-aac/aacdecoder_lib.h>

// https://github.com/mstorsjo/fdk-aac

class SimpleAACDecoder {
private:
  HANDLE_AACDECODER mDecoder;

public:
  SimpleAACDecoder();
  virtual ~SimpleAACDecoder();

  void initADTS();
  void initRaw(const uint8_t *ascData, uint32_t ascDataLen);
  int32_t fillData(const uint8_t *inBuffer, uint32_t inBufferSize);
  int32_t decode(int16_t *outBuffer, uint32_t outBufferSize);
  void destroy();
};
