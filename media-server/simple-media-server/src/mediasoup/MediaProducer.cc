#include "MediaProducer.h"
#include "../rtp/H264RTPSender.h"
#include "../rtp/OpusRTPSender.h"

MediaProducer::MediaProducer(std::shared_ptr<StreamInfo> info) : info(info)
{
  mVideoSender = nullptr;
  mAudioSender = nullptr;

  if (info->videoInfo.enabled) {
    state = CreatingVideo;
  } else if (info->audioInfo.enabled) {
    state = CreatingAudio;
  } else {
    state = None;
  }
}

MediaProducer::~MediaProducer()
{
  closeVideo();
  closeAudio();
  info = nullptr;
  state = None;
}

void MediaProducer::openVideo()
{
  if (!info->videoInfo.enabled) {
    return;
  }

  if (info->videoInfo.codec.mimeType.compare("video/h264") == 0) {
    std::shared_ptr<RTPSender> sender = std::make_shared<H264RTPSender>();
    sender->setDestIPAddress(video.ip);
    sender->setDestPort(video.port);
    sender->setPortBase(0);
    sender->setFrequency(info->videoInfo.codec.clockRate);
    sender->open();
    mVideoSender = sender;
  } else {
    LOG_WARN("VideoCodec not supported. codec=%s\n", info->videoInfo.codec.mimeType.c_str());
  }
}

void MediaProducer::openAudio()
{
  if (!info->audioInfo.enabled) {
    return;
  }

  if (info->audioInfo.codec.mimeType.compare("audio/opus") == 0) {
    std::shared_ptr<RTPSender> sender = std::make_shared<OpusRTPSender>();
    sender->setDestIPAddress(audio.ip);
    sender->setDestPort(audio.port);
    sender->setPortBase(0);
    sender->setFrequency(info->audioInfo.codec.clockRate);
    sender->open();
    mAudioSender = sender;
  } else {
    LOG_WARN("AudioCodec not supported. codec=%s\n", info->videoInfo.codec.mimeType.c_str());
  }
}

int MediaProducer::getVideoSenderSSRC()
{
  if (mVideoSender) {
    return mVideoSender->getLocalSSRC();
  }
  return 0;
}

int MediaProducer::getAudioSenderSSRC()
{
  if (mAudioSender) {
    return mAudioSender->getLocalSSRC();
  }
  return 0;
}

void MediaProducer::closeVideo()
{
  mVideoSender = nullptr;
}

void MediaProducer::closeAudio()
{
  mAudioSender = nullptr;
}

void MediaProducer::sendVideo(const char *data, const uint32_t size)
{
  if (mVideoSender) {
    mVideoSender->send(data, size);
  }
}

void MediaProducer::sendAudio(const char *data, const uint32_t size)
{
  if (mAudioSender) {
    mAudioSender->send(data, size);
  }
}
