#pragma once

#include <memory>
#include <string>
#include <vector>
#include <fstream>
#include <iostream>

#include "../Settings.h"

class MediaOutput {
public:
  MediaOutput(Settings &settings) : mSettings(settings) {}
  virtual ~MediaOutput() {}

  virtual void start() = 0;
  virtual void stop() = 0;
  virtual void resume() = 0;
  virtual void pause() = 0;
  virtual void sendVideoData(const uint8_t *data, const uint32_t size, const uint32_t timestamp) = 0;
  virtual void sendAudioData(const uint8_t *data, const uint32_t size, const uint32_t timestamp) = 0;

protected:
  Settings& mSettings;
};
