#include "OpusEncoder.h"
#include "../../utils/Log.h"

SimpleOpusEncoder::SimpleOpusEncoder()
{
  mEncoder = nullptr;
  mBitrate = 64000;
}

SimpleOpusEncoder::~SimpleOpusEncoder()
{
  destroy();
}

void SimpleOpusEncoder::initialize(uint32_t sampleRate, uint8_t channels)
{
  int err;

  if (mEncoder) {
    LOG_ERROR("SimpleOpusEncoder has already been initialized.\n");
    return;
  }

  mSampleRate = sampleRate;
  mChannels = channels;

  mEncoder = opus_encoder_create(sampleRate, channels, OPUS_APPLICATION_AUDIO, &err);
  if (err < 0) {
    LOG_ERROR("Failed to create an opus encoder: %s\n", opus_strerror(err));
    return;
  }

  err = opus_encoder_ctl(mEncoder, OPUS_SET_BITRATE(mBitrate));
  if (err < 0) {
    LOG_ERROR("Failed to set bitrate to opus encoder: %s\n", opus_strerror(err));
    return;
  }
}

void SimpleOpusEncoder::destroy()
{
  if (mEncoder) {
    opus_encoder_destroy(mEncoder);
    mEncoder = nullptr;
  }
}

void SimpleOpusEncoder::setBitrate(uint32_t bitrate)
{
  mBitrate = bitrate;

  if (mEncoder) {
    int err = opus_encoder_ctl(mEncoder, OPUS_SET_BITRATE(bitrate));
    if (err < 0) {
      LOG_ERROR("Failed to set bitrate to opus encoder: %s\n", opus_strerror(err));
      return;
    }
  }
}

int32_t SimpleOpusEncoder::encode(opus_int16 *inFrame, uint32_t inFrameSize, uint8_t *outBuffer, uint32_t maxOutBufferSize)
{
  if (!mEncoder) {
    LOG_ERROR("SimpleOpusEncoder is not initialized.\n");
    return -1;
  }

  int32_t nbBytes = opus_encode(mEncoder, inFrame, inFrameSize, outBuffer, maxOutBufferSize);
  if (nbBytes < 0) {
    LOG_ERROR("opus encode failed: %s\n", opus_strerror(nbBytes));
    return -1;
  }
  return nbBytes;
}
