#pragma once

#include <queue>
#include <mutex>
#include <condition_variable>

template<typename T>
class BlockingQueue {
private:
  std::queue<T> mQueue;
  mutable std::mutex mGuard;
  std::condition_variable mSignal;

public:
  void push(T const& _data)
  {
    {
      std::lock_guard<std::mutex> lock(mGuard);
      mQueue.push(_data);
    }
    mSignal.notify_one();
  }

  bool empty() const
  {
    std::lock_guard<std::mutex> lock(mGuard);
    return mQueue.empty();
  }

  bool tryPop(T& _value)
  {
    std::lock_guard<std::mutex> lock(mGuard);
    if (mQueue.empty()) {
      return false;
    }

    _value = mQueue.front();
    mQueue.pop();
    return true;
  }

  void waitAndPop(T& _value)
  {
    std::unique_lock<std::mutex> lock(mGuard);
    while (mQueue.empty()) {
      mSignal.wait(lock);
    }

    _value = mQueue.front();
    mQueue.pop();
  }

  bool tryWaitAndPop(T& _value, int _milli)
  {
    std::unique_lock<std::mutex> lock(mGuard);
    while (mQueue.empty()) {
      mSignal.wait_for(lock, std::chrono::milliseconds(_milli));
      return false;
    }

    _value = mQueue.front();
    mQueue.pop();
    return true;
  }
};