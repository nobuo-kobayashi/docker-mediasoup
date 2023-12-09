#pragma once

#include "RTPSender.h"

class OpusRTPSender : public RTPSender {
public:
  OpusRTPSender();
  virtual ~OpusRTPSender();

  virtual void send(const char *data, const uint32_t dataLen) override;
};
