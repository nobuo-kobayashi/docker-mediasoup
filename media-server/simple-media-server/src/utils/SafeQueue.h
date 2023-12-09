#pragma once

#include <queue>
#include <mutex>

template<typename T>
class SafeQueue {
private:
  std::queue<T> mQueue;
  std::mutex mQueueMutex;

public:
  SafeQueue() {
  }

  ~SafeQueue() {
    clear();
  }

  bool empty() {
    std::lock_guard<std::mutex> lock(mQueueMutex);
    return mQueue.empty();
  }

  int size() {
    std::lock_guard<std::mutex> lock(mQueueMutex);
    return mQueue.size();
  }

  void push(T value) {
    std::lock_guard<std::mutex> lock(mQueueMutex);
    mQueue.push(value);
  }

  T front() {
    std::lock_guard<std::mutex> lock(mQueueMutex);
    return mQueue.front();
  }

  T back() {
    std::lock_guard<std::mutex> lock(mQueueMutex);
    return mQueue.back();
  }

  T pop() {
    std::lock_guard<std::mutex> lock(mQueueMutex);
    T value = mQueue.front();
    mQueue.pop();
    return value;
  }
  
  void clear() {
    std::lock_guard<std::mutex> lock(mQueueMutex);
    while (!mQueue.empty()) {
      mQueue.pop();
    }
  }
};
