#include "AudioSpecificConfig.h"
#include "../../utils/BitReader.h"
#include "../../utils/Log.h"
#include <map>

void AudioSpecificConfigParser::parse(const uint8_t *ascData, uint32_t ascDataLen, AudioSpecificConfig *asc)
{
  BitReader reader(ascData, ascDataLen);

  asc->audioObjectType = reader.readBits(5);
  if (asc->audioObjectType == 31) {
    asc->audioObjectType = 32 + reader.readBits(6);
  }

  asc->frequencyIndex = reader.readBits(4);
  if (asc->frequencyIndex == 0xF) {
    asc->frequency = reader.readBits(24);
  } else {
    asc->frequency = getSamplingFrequencyIndex(asc->frequencyIndex);
  }

  asc->channelConfiguration = reader.readBits(4);

  if (asc->audioObjectType == 5 || asc->audioObjectType == 29) {
    asc->extensionAudioObjectType = 5;
    asc->sbrPresentFlag = true;
    if (asc->audioObjectType == 29) {
      asc->spsPresentFlag = true;
    }
    asc->extensionSamplingFrequencyIndex = reader.readBits(4);
    if (asc->extensionSamplingFrequencyIndex == 0xF) {
      asc->extensionSamplingFrequency = reader.readBits(24);
    } else {
      asc->extensionSamplingFrequency = getSamplingFrequencyIndex(asc->extensionSamplingFrequencyIndex);
    }
    asc->audioObjectType = reader.readBits(5);
    if (asc->audioObjectType == 31) {
      asc->audioObjectType = 32 + reader.readBits(6);
    }
    if (asc->audioObjectType == 22) {
      asc->extensionChannelConfiguration= reader.readBits(4);
    }
  } else {
    asc->extensionAudioObjectType = 0;
  } 

  asc->rawData.assign(&ascData[0], &ascData[ascDataLen]);
}

uint32_t AudioSpecificConfigParser::getSamplingFrequencyIndex(uint8_t frequencyIndex)
{
  std::map<uint8_t, uint32_t> frequency {
    {0x0, 96000},
    {0x1, 88200},
    {0x2, 64000},
    {0x3, 48000},
    {0x4, 44100},
    {0x5, 32000},
    {0x6, 24000},
    {0x7, 22050},
    {0x8, 16000},
    {0x9, 12000},
    {0xa, 11025},
    {0xb, 8000},
    {0xc, 7350},
    {0xd, 0},
    {0xe, 0}
  };
  return frequency.at(frequencyIndex);
}

void AudioSpecificConfigParser::print(AudioSpecificConfig *asc)
{
  LOG_INFO("AudioSpecificConfig\n");
  LOG_INFO("    audioObjectType: %d\n", asc->audioObjectType);
  LOG_INFO("    frequencyIndex: %d\n", asc->frequencyIndex);
  LOG_INFO("    frequency: %d\n", asc->frequency);
  LOG_INFO("    channelConfiguration: %d\n", asc->channelConfiguration);
}
