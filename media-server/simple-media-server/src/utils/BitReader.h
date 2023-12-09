#pragma once

#include <vector>
#include <bitset>
#include <string>

class BitReader {
protected:
  std::vector<uint8_t> mBitstream;
  size_t mPosition;

public:
  BitReader(std::vector<uint8_t>& input);
  BitReader(const uint8_t* data, size_t size);
  virtual ~BitReader();

  int readBits(int bits);
  bool readBit(int position);
};
