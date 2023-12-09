#include "BaseThread.h"
#include "Log.h"
#include <stdlib.h>
#include <stdio.h>

BaseThread::BaseThread()
{
  mThreadId = 0;
  mStopFlag = false;
}

BaseThread::~BaseThread()
{
  stopThread();
  mThreadId = 0;
}

void *BaseThread::execThread(void *arg)
{
  BaseThread *thread = (BaseThread *) arg;
  thread->runThread();
  return nullptr;
}

void BaseThread::startThread()
{
  if (mThreadId != 0) {
    // すでにスレッドが作成されている場合
    return;
  }

  pthread_t id = 0;
  pthread_attr_t attributes;

  pthread_attr_init(&attributes);
  pthread_attr_setdetachstate(&attributes, PTHREAD_CREATE_DETACHED);

  int ret = pthread_create(&id, &attributes, execThread, this);
  if (ret == 0) {
    mThreadId = id;
  } else {
    mStopFlag = true;
    LOG_CRITICAL("Failed to create a pthread.\n");
  }
}

void BaseThread::stopThread()
{
  mStopFlag = true;
}

void BaseThread::joinThread()
{
  if (mThreadId != 0) {
    pthread_join(mThreadId, NULL);
  }
}

