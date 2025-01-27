#pragma once

#include "RTPSender.h"

class OpusRTPSender : public RTPSender {
public:
  OpusRTPSender();
  virtual ~OpusRTPSender();

  virtual void send(const uint8_t *data, const uint32_t dataLen) override;
};
