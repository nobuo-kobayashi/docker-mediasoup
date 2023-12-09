#pragma once

#include <librtmp/rtmp.h>
#include <librtmp/log.h>
#include <librtmp/amf.h>
#include <map>
#include <string>

#include "../codec/aac/AudioSpecificConfig.h"
#include "../codec/h264/AVCDecoderConfigurationRecord.h"

#include "../utils/BaseThread.h"
#include "../utils/Log.h"
#include "../utils/NetworkUtils.h"
#include "../utils/AAC2OpusConv.h"

class RTMPClient;

class RTMPClientListener {
public:
  virtual bool onStreamKey(RTMPClient *client, std::string streamKey) { return true; }
  virtual void onClosed(RTMPClient *client) {}
  virtual void onReceivedVideoConfig(RTMPClient *client, AVCDecoderConfigurationRecord *config) {}
  virtual void onReceivedAudioConfig(RTMPClient *client, AudioSpecificConfig *config) {}
  virtual void onReceivedVideoData(RTMPClient *client, const char *data, uint32_t size, uint32_t timestamp) {}
  virtual void onReceivedAudioData(RTMPClient *client, const char *data, uint32_t size, uint32_t timestamp) {}
};

class RTMPClient : public BaseThread {
private:
  RTMPClientListener *mListener;
  int mSocketfd;
  void *mSslCtx;
  int mStreamID;
  AVCDecoderConfigurationRecord mAvcConfig;
  AudioSpecificConfig mAacConfig;

  typedef void (RTMPClient::*ParsePacketFunc)(RTMP *rtmp, const RTMPPacket *packet);
  std::map<int, ParsePacketFunc> Functions;

  void RunRTMP();
  void ParsePacket(RTMP *r, const RTMPPacket *packet);
  int SendConnectResult(RTMP *r, double txn);
  int SendResultNumber(RTMP *r, double txn, double ID);
  int SendOnFCPublish(RTMP *r, double txn);

  void ParseConnectAMFProp(RTMP *r, AMFObject *cobj);
  void ParseAMFObject(RTMP *r, AMFObject *obj);

  void HandleInvoke(RTMP *r, const RTMPPacket *packet);
  void HandleInfo(RTMP *r, const RTMPPacket *packet);
  void HandleChangeChunkSize(RTMP *r, const RTMPPacket *packet);
  void HandleAudio(RTMP *r, const RTMPPacket *packet);
  void HandleVideo(RTMP *r, const RTMPPacket *packet);
  void HandleCtrl(RTMP *r, const RTMPPacket *packet);
  void HandleServerBW(RTMP *r, const RTMPPacket *packet);
  void HandleClientBW(RTMP *r, const RTMPPacket *packet);
  void HandleUnimplement(RTMP *r, const RTMPPacket *packet);

protected:
  virtual void runThread() override;

public:
  std::string streamKey;

public:
  RTMPClient(int socketfd);
  virtual ~RTMPClient();

  void useSSL(void *ctx);
  void disconnect();

  int getSockfd() {
    return mSocketfd;
  }

  void setListener(RTMPClientListener *listener) {
    mListener = listener;
  }

  AAC2OpusConv conv;
};
