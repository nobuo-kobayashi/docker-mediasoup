#include "FrameBufferCache.h"

FrameBufferCache::FrameBufferCache()
{
  stopFlag.store(true);
  setTargetFPS(30);
}

FrameBufferCache::~FrameBufferCache()
{
  stopProcessing();
  clearFrame();
}

void FrameBufferCache::setTargetFPS(uint32_t targetFPS)
{
  fps = targetFPS;
  frameInterval = std::chrono::microseconds(1000000 / fps);
}


void FrameBufferCache::addFrame(const FrameBuffer& frame)
{
  {
    std::lock_guard<std::mutex> lock(mtx);
    frameQueue.push(frame);
  }
  cv.notify_one();
}

void FrameBufferCache::startProcessing(CallbackFunction callback)
{
  if (!stopFlag.load()) {
    // 既に起動されている場合は処理を行わない。
    return;
  }
  stopFlag.store(false);
  processingThread = std::thread([this, callback]() {
    processFrames(callback);
  });
}

void FrameBufferCache::stopProcessing()
{
  stopFlag.store(true);
  cv.notify_all();

  if (processingThread.joinable()) {
    processingThread.join();
  }
}

void FrameBufferCache::clearFrame()
{
  std::lock_guard<std::mutex> lock(mtx);
  std::queue<FrameBuffer> empty;
  std::swap(frameQueue, empty);

}

FrameBuffer FrameBufferCache::getNextFrame()
{
  std::unique_lock<std::mutex> lock(mtx);

  cv.wait(lock, [this] {
    return !frameQueue.empty();
  });

  FrameBuffer frame = frameQueue.front();
  frameQueue.pop();
  return frame;
}

bool FrameBufferCache::hasFrames() const
{
  std::lock_guard<std::mutex> lock(mtx);
  return !frameQueue.empty();
}

void FrameBufferCache::processFrames(CallbackFunction callback)
{
  while (!stopFlag.load()) {
    auto start = std::chrono::steady_clock::now();

    try {
      FrameBuffer frame = getNextFrame();
      callback(frame.streamKey, frame.data.data(), frame.data.size(), frame.timestamp);
    } catch (const std::runtime_error& e) {
      // フレームがなくて停止フラグが立っている場合に停止
      std::cout << e.what() << std::endl;
      break;
    }

    auto end = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
    auto sleepDuration = std::max(frameInterval - elapsed, std::chrono::microseconds(0));
    std::this_thread::sleep_for(sleepDuration);
  }

  std::cout << "Frame processing stopped." << std::endl;
}
