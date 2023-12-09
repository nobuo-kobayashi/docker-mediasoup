#include "BitReader.h"
#include "Log.h"

BitReader::BitReader(std::vector<uint8_t>& input) : mBitstream(input)
{
  mPosition = 0;
}

BitReader::BitReader(const uint8_t* data, size_t size)
{
  mBitstream = std::vector<uint8_t>(data, data + size);
  mPosition = 0;
}

BitReader::~BitReader()
{
  mBitstream.clear();
}

int BitReader::readBits(int bits)
{
  int result = 0;
  for (int i = 0; i < bits; i++) {
    result <<= 1;
    if (readBit(mPosition++)) {
      result |= 1;
    }
  }
  return result;
}

bool BitReader::readBit(int position)
{
  int byteIndex = position / 8;
  int bitIndex = position % 8;

  if (mBitstream.size() < byteIndex) {
    LOG_ERROR("Failed to read a bit reader, because size over. StreamSize=%d < byteIndex=%d\n", mBitstream.size(), byteIndex);
    return false;
  }

  return (mBitstream[byteIndex] & (0x80 >> bitIndex)) != 0;
}