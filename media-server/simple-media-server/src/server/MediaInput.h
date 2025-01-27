#pragma once

#include <memory>
#include <string>
#include <vector>
#include <fstream>
#include <iostream>

#include "../Settings.h"
#include "MediaOutput.h"

class MediaInput {
public:
  MediaInput(Settings &settings) : mSettings(settings), mMediaOutput(nullptr) {}
  virtual ~MediaInput() {
    mMediaOutput = nullptr;
  }

  virtual void start() = 0;
  virtual void stop() = 0;

  void setMediaOutput(std::shared_ptr<MediaOutput> output) {
    mMediaOutput = output;
  }

protected:
  std::shared_ptr<MediaOutput> mMediaOutput;

protected:
  Settings& mSettings;
};
