#pragma once

#include <stdint.h>
#include <vector>

class AudioSpecificConfig {
public:
  std::vector<uint8_t> rawData;
  uint8_t audioObjectType;
  uint8_t frequencyIndex;
  uint32_t frequency;
  uint8_t channelConfiguration;
  uint8_t extensionAudioObjectType;
  bool sbrPresentFlag;
  bool spsPresentFlag;
  uint8_t extensionSamplingFrequencyIndex;
  uint32_t extensionSamplingFrequency;
  uint8_t extensionChannelConfiguration;
};

class AudioSpecificConfigParser {
private:
  AudioSpecificConfigParser() {}

public:
  static void parse(const uint8_t *ascData, uint32_t ascDataLen, AudioSpecificConfig *asc);
  static uint32_t getSamplingFrequencyIndex(uint8_t frequencyIndex);
  static void print(AudioSpecificConfig *asc);
};
