#pragma once

#include <pthread.h>

class BaseThread {
private:
  pthread_t mThreadId;
  bool mStopFlag;

  static void *execThread(void *arg);

protected:
  virtual void runThread() {};

public:
  BaseThread();
  virtual ~BaseThread();

  bool isStopped() {
    return mStopFlag;
  }

  void startThread();
  void stopThread();
  void joinThread();
};
