#pragma once

#include "RTPSender.h"

class H264RTPSender : public RTPSender {
private:
  uint32_t mFps;

  void sendSingleNalUnitPacket(const uint8_t *buf, const uint32_t len);
  void sendFragmentationUnitsPacket(const uint8_t *buf, const uint32_t len);

public:
  H264RTPSender();
  virtual ~H264RTPSender();

  virtual void send(const uint8_t *data, const uint32_t dataLen) override;
};
