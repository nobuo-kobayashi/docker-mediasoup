#pragma once

#include <stdint.h>
#include <vector>

class AVCDecoderConfigurationRecord {
public:
  std::vector<uint8_t> rawData;
  uint8_t configurationVersion;
  uint8_t AVCProfileIndication;
  uint8_t profile_compatibility;
  uint8_t AVCLevelIndication;
  uint8_t lengthSizeMinusOne;
  std::vector<std::vector<uint8_t>> sequenceParameterSetNALUnits;
  std::vector<std::vector<uint8_t>> pictureParameterSetNALUnits;
};

class AVCDecoderConfigurationRecordParser {
private:
  AVCDecoderConfigurationRecordParser() {}

public:
  static void parse(const char *data, uint32_t dataLen, AVCDecoderConfigurationRecord *avcConfig);
  static void print(AVCDecoderConfigurationRecord *avcConfig);
};
