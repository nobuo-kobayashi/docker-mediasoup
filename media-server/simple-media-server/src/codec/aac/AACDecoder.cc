#include "AACDecoder.h"
#include "../../utils/Log.h"

SimpleAACDecoder::SimpleAACDecoder()
{
  mDecoder = nullptr;
}

SimpleAACDecoder::~SimpleAACDecoder()
{
  destroy();
}

void SimpleAACDecoder::initADTS()
{
  if (mDecoder) {
    LOG_ERROR("SimpleAACDecoder has already been initialized.\n");
    return;
  }

  mDecoder = aacDecoder_Open(TT_MP4_ADTS, 1);
  if (mDecoder == nullptr) {
    LOG_ERROR("Failed to create aacDecoder.\n");
    return;
  }
}

void SimpleAACDecoder::initRaw(const uint8_t *ascData, uint32_t ascDataLen)
{
  if (mDecoder) {
    LOG_ERROR("SimpleAACDecoder has already been initialized.\n");
    return;
  }

  mDecoder = aacDecoder_Open(TT_MP4_RAW, 1);
  if (mDecoder == nullptr) {
    LOG_ERROR("Failed to create aacDecoder.\n");
    return;
  }

  UCHAR *aacInputBuffer = (UCHAR *)ascData;
  UINT bytesValid = ascDataLen;
  if (aacDecoder_ConfigRaw(mDecoder, &aacInputBuffer, &bytesValid) != AAC_DEC_OK) {
    LOG_ERROR("Failed to initialize aacDecoder.\n");
    return;
  }
}

void SimpleAACDecoder::destroy()
{
  if (mDecoder) {
    aacDecoder_Close(mDecoder);
    mDecoder = nullptr;
  }
}

int32_t SimpleAACDecoder::fillData(const uint8_t *inBuffer, uint32_t inBufferSize)
{
  if (!mDecoder) {
    LOG_ERROR("SimpleAACDecoder is not initialized.\n");
    return -1;
  }

  UCHAR *aacInputBuffer = (UCHAR *)inBuffer;
  UINT bytesValid = inBufferSize;
  if (aacDecoder_Fill(mDecoder, &aacInputBuffer, &inBufferSize, &bytesValid) != AAC_DEC_OK) {
    LOG_ERROR("Failed to init aac decoder.\n");
    return -1;
  }
  return bytesValid;
}

int32_t SimpleAACDecoder::decode(int16_t *outBuffer, uint32_t outBufferSize)
{
  if (!mDecoder) {
    LOG_ERROR("SimpleAACDecoder is not initialized.\n");
    return -1;
  }

  INT_PCM *outPCM = (INT_PCM *)outBuffer;
  if (aacDecoder_DecodeFrame(mDecoder, outPCM, outBufferSize, 0) == AAC_DEC_OK) {
    CStreamInfo *info = aacDecoder_GetStreamInfo(mDecoder);
    if (info) {
      return info->numChannels * info->frameSize;
    }
  }
  return -1;
}
