#pragma once

#include <iostream>
#include <queue>
#include <chrono>
#include <thread>
#include <vector>
#include <mutex>
#include <condition_variable>
#include <algorithm> 
#include <cstring>
#include <atomic>

class FrameBuffer {
public:
  std::string streamKey;
  std::vector<uint8_t> data;
  uint32_t timestamp;

  FrameBuffer(std::string& key, const uint8_t* frameData, uint32_t size, uint32_t time) : streamKey(key), data(size), timestamp(time) {
    std::memcpy(data.data(), frameData, size);
  }

  FrameBuffer(std::string& key, const std::vector<uint8_t>& frameData, uint32_t time) : streamKey(key), data(frameData), timestamp(time) {
  }

  virtual ~FrameBuffer() {
  }
};

class FrameBufferCache {
private:
  uint32_t fps;
  std::queue<FrameBuffer> frameQueue;
  std::chrono::microseconds frameInterval;
  mutable std::mutex mtx;
  std::condition_variable cv;
  std::atomic<bool> stopFlag;
  std::thread processingThread;

public:
  typedef std::function<void(std::string streamKey, const uint8_t *data, uint32_t size, uint32_t timestamp)> CallbackFunction;

private:
  void processFrames(CallbackFunction callback);

public:
  FrameBufferCache();
  virtual ~FrameBufferCache();

  void setTargetFPS(uint32_t targetFPS);
  void startProcessing(CallbackFunction callback);
  void stopProcessing();
  bool hasFrames() const;
  void addFrame(const FrameBuffer& frame);
  void clearFrame();
  FrameBuffer getNextFrame();
};
