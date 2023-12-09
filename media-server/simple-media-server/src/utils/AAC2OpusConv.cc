#include "AAC2OpusConv.h"
#include "Log.h"

#define MAX_DECODE_BUFFER_SIZE (10 * 1024)
#define OPUS_FRAME_SIZE 960

AAC2OpusConv::AAC2OpusConv()
{
  mSampleRate = 48000;
  mChannels = 2;
}

AAC2OpusConv::~AAC2OpusConv()
{
  destroy();
}

void AAC2OpusConv::init(AudioSpecificConfig *config)
{
  initAACRawDecoder(config->rawData.data(), config->rawData.size());
  initOpusEncoder(config->frequency, config->channelConfiguration);
}

void AAC2OpusConv::initAACRawDecoder(const uint8_t *ascData, uint32_t ascDataLen)
{
  mDecoder.initRaw(ascData, ascDataLen);
}

void AAC2OpusConv::initOpusEncoder(uint32_t sampleRate, uint8_t channels)
{
  mSampleRate = sampleRate;
  mChannels = channels;
  mEncoder.initialize(sampleRate, channels);
}

void AAC2OpusConv::destroy()
{
  mDecoder.destroy();
  mEncoder.destroy();
  mBuf.clear();
}

int32_t AAC2OpusConv::decode(const uint8_t *inBuffer, uint32_t inBufferSize)
{
  if (mDecoder.fillData(inBuffer, inBufferSize) < 0) {
    return -1;
  }

  int16_t decodeBuffer[MAX_DECODE_BUFFER_SIZE];
  int32_t decodeBufferSize = 0;
  while ((decodeBufferSize = mDecoder.decode(decodeBuffer, MAX_DECODE_BUFFER_SIZE)) > 0) {
    mBuf.insert(mBuf.end(), decodeBuffer, decodeBuffer + decodeBufferSize);
  }
  return 1;
}

int32_t AAC2OpusConv::encode(uint8_t *outBuffer, uint32_t maxOutBufferSize)
{
  if (mBuf.size() < (OPUS_FRAME_SIZE * mChannels)) {
    return -1;
  }

  int32_t encodeSize = mEncoder.encode((opus_int16 *)mBuf.data(), OPUS_FRAME_SIZE, outBuffer, maxOutBufferSize);
  if (encodeSize < 0) {
    return -1;
  }
  mBuf.erase(mBuf.begin(), mBuf.begin() + (OPUS_FRAME_SIZE * mChannels));
  return encodeSize;
}
