#include "AVCDecoderConfigurationRecord.h"
#include "../../utils/Log.h"

void AVCDecoderConfigurationRecordParser::parse(const char *data, uint32_t dataLen, AVCDecoderConfigurationRecord* avcConfig)
{
  uint32_t index = 0;
  avcConfig->configurationVersion = data[index++] & 0xFF;
  avcConfig->AVCProfileIndication = data[index++] & 0xFF;
  avcConfig->profile_compatibility = data[index++] & 0xFF;
  avcConfig->AVCLevelIndication = data[index++] & 0xFF;
  avcConfig->lengthSizeMinusOne = data[index++] & 0x03;

  uint8_t numOfSequenceParameterSets = data[index++] & 0x1F;
  for (int i = 0; i < numOfSequenceParameterSets; i++) {
    uint16_t sequenceParameterSetLength = ((data[index++] & 0xFF) << 8) | (data[index++] & 0xFF);
    std::vector<uint8_t> sps;
    for (int j = 0; j < sequenceParameterSetLength; j++) {
      sps.push_back(data[index++] & 0xFF);
    }
    avcConfig->sequenceParameterSetNALUnits.push_back(sps);
  }

  uint8_t numOfPictureParameterSets = (data[index++] & 0xFF);
  for (int i = 0; i < numOfPictureParameterSets; i++) {
    uint16_t pictureParameterSetLength = ((data[index++] & 0xFF) << 8) | (data[index++] & 0xFF);
    std::vector<uint8_t> pps;
    for (int j = 0; j < pictureParameterSetLength; j++) {
      pps.push_back(data[index++] & 0xFF);
    }
    avcConfig->pictureParameterSetNALUnits.push_back(pps);
  }

  avcConfig->rawData.assign(&data[0], &data[dataLen]);
}

void AVCDecoderConfigurationRecordParser::print(AVCDecoderConfigurationRecord *avcConfig)
{
  LOG_INFO("    avcC \n");
  LOG_INFO("      configurationVersion=%02x\n", avcConfig->configurationVersion);
  LOG_INFO("      AVCProfileIndication=%02x\n", avcConfig->AVCProfileIndication);
  LOG_INFO("      profile_compatibility=%02x\n", avcConfig->profile_compatibility);
  LOG_INFO("      AVCLevelIndication=%02x\n", avcConfig->AVCLevelIndication);
  LOG_INFO("      lengthSizeMinusOne=%d\n", avcConfig->lengthSizeMinusOne);
  LOG_INFO("      numOfSequenceParameterSets=%d\n", avcConfig->sequenceParameterSetNALUnits.size());
  for (int i = 0; i < avcConfig->sequenceParameterSetNALUnits.size(); i++) {
    LOG_INFO("        sequenceParameterSetNALUnit=");
    std::vector<uint8_t> sps = avcConfig->sequenceParameterSetNALUnits.at(i);
    for (int j = 0; j < sps.size(); j++) {
      LOG_INFO("%02x", (sps[j] & 0xFF));
    }
    LOG_INFO("\n");
  }
  LOG_INFO("      numOfPictureParameterSets=%d\n", avcConfig->pictureParameterSetNALUnits.size());
  for (int i = 0; i < avcConfig->pictureParameterSetNALUnits.size(); i++) {
    std::vector<uint8_t> pps = avcConfig->pictureParameterSetNALUnits.at(i);
    LOG_INFO("        pictureParameterSetNALUnit=");
    for (int j = 0; j < pps.size(); j++) {
      LOG_INFO("%02x", (pps[j] & 0xFF));
    }
    LOG_INFO("\n");
  }
}
