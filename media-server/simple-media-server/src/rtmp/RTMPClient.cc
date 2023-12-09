#include "RTMPClient.h"
#include "RTMPUtility.h"
#include <stdlib.h>
#include <string.h>
#include <sys/select.h>
#include <unistd.h>

#define STR2AVAL(av,str)	av.av_val = (char *)str; av.av_len = strlen(av.av_val)

#define SAVC(x) static const AVal av_##x = AVC(#x)

SAVC(app);
SAVC(connect);
SAVC(flashVer);
SAVC(swfUrl);
SAVC(pageUrl);
SAVC(tcUrl);
SAVC(fpad);
SAVC(capabilities);
SAVC(audioCodecs);
SAVC(videoCodecs);
SAVC(videoFunction);
SAVC(objectEncoding);
SAVC(_result);
SAVC(createStream);
SAVC(releaseStream);
SAVC(getStreamLength);
SAVC(play);
SAVC(fmsVer);
SAVC(mode);
SAVC(level);
SAVC(code);
SAVC(description);
SAVC(secureToken);
SAVC(FCPublish);
SAVC(onFCPublish);
SAVC(publish);
SAVC(live);
SAVC(onStatus);
SAVC(status);
SAVC(onMetaData);
SAVC(details);
SAVC(clientid);

static const AVal av_dquote = AVC("\"");
static const AVal av_escdquote = AVC("\\\"");
static const AVal av_NetStream_Publish_Start = AVC("NetStream.Publish.Start");
static const AVal av_NetStream_Play_Start = AVC("NetStream.Play.Start");
static const AVal av_Started_playing = AVC("Started playing");
static const AVal av_NetStream_Play_Stop = AVC("NetStream.Play.Stop");
static const AVal av_Stopped_playing = AVC("Stopped playing");
static const AVal av_NetStream_Authenticate_UsherToken = AVC("NetStream.Authenticate.UsherToken");

RTMPClient::RTMPClient(int socketfd) : mSocketfd(socketfd)
{
  mListener = nullptr;
  mSslCtx = nullptr;
  mStreamID = 0;

  Functions[RTMP_PACKET_TYPE_CHUNK_SIZE] = &RTMPClient::HandleChangeChunkSize;
  Functions[RTMP_PACKET_TYPE_BYTES_READ_REPORT] = &RTMPClient::HandleUnimplement;
  Functions[RTMP_PACKET_TYPE_CONTROL] = &RTMPClient::HandleCtrl;
  Functions[RTMP_PACKET_TYPE_SERVER_BW] = &RTMPClient::HandleServerBW;
  Functions[RTMP_PACKET_TYPE_CLIENT_BW] = &RTMPClient::HandleClientBW;
  Functions[RTMP_PACKET_TYPE_AUDIO] = &RTMPClient::HandleAudio;
  Functions[RTMP_PACKET_TYPE_VIDEO] = &RTMPClient::HandleVideo;
  Functions[RTMP_PACKET_TYPE_FLEX_STREAM_SEND] = &RTMPClient::HandleUnimplement;
  Functions[RTMP_PACKET_TYPE_FLEX_SHARED_OBJECT] = &RTMPClient::HandleUnimplement;
  Functions[RTMP_PACKET_TYPE_FLEX_MESSAGE] = &RTMPClient::HandleUnimplement;
  Functions[RTMP_PACKET_TYPE_INFO] = &RTMPClient::HandleInfo;
  Functions[RTMP_PACKET_TYPE_SHARED_OBJECT] = &RTMPClient::HandleUnimplement;
  Functions[RTMP_PACKET_TYPE_INVOKE] = &RTMPClient::HandleInvoke;
  Functions[RTMP_PACKET_TYPE_FLASH_VIDEO] = &RTMPClient::HandleUnimplement;
}

RTMPClient::~RTMPClient()
{
  disconnect();
}

void RTMPClient::disconnect()
{
  if (mSocketfd) {
    ::close(mSocketfd);
    mSocketfd = 0;
  }
}

void RTMPClient::runThread()
{
  // 接続元の ip アドレスを表示
  char destch[16] = { 0 };
  NetworkUtils::GetIPAddress(mSocketfd, destch);
  LOG_INFO("RTMPClient connected: IP=%s.\n", destch);

  {
    fd_set fds;
    struct timeval tv = { 0 };
    tv.tv_sec = 5;

    FD_ZERO(&fds);
    FD_SET(mSocketfd, &fds);

    // fds に設定されたソケットが読み込み可能になるまで待ちます。
    // タイムアウトの場合に select は 0 を返します。
    if (select(mSocketfd + 1, &fds, NULL, NULL, &tv) <= 0) {
      LOG_ERROR("Request timeout/select failed, ignoring request.\n");
    } else {
      RunRTMP();
    }
  }

  LOG_INFO("RTMPClient disconnected: IP=%s\n", destch);

  if (mListener) {
    mListener->onClosed(this);
  }
}

void RTMPClient::useSSL(void *ctx)
{
  mSslCtx = ctx;
}

void RTMPClient::RunRTMP()
{
  RTMP *rtmp = RTMP_Alloc();
  RTMPPacket packet = { 0 };

  if (!rtmp) {
    LOG_ERROR("Failed to allocate memory for RTMP.\n");
    goto cleanup;
  }

  RTMP_Init(rtmp);
  rtmp->m_sb.sb_socket = mSocketfd;

  if (mSslCtx && !RTMP_TLS_Accept(rtmp, mSslCtx)) {
    LOG_ERROR("TLS handshake failed.\n");
    goto cleanup;
  }

  if (!RTMP_Serve(rtmp)) {
    LOG_ERROR("Handshake failed.\n");
    goto cleanup;
  }

  while (!isStopped() && RTMP_IsConnected(rtmp) && RTMP_ReadPacket(rtmp, &packet)) {
    if (!RTMPPacket_IsReady(&packet)) {
      LOG_DEBUG("RTMPPacket is not ready.\n");
      continue;
    }
    ParsePacket(rtmp, &packet);
    RTMPPacket_Free(&packet);
  }

cleanup:
  if (rtmp) {
    RTMP_Close(rtmp);

    // Should probably be done by RTMP_Close();
    rtmp->Link.playpath.av_val = NULL;
    rtmp->Link.tcUrl.av_val = NULL;
    rtmp->Link.swfUrl.av_val = NULL;
    rtmp->Link.pageUrl.av_val = NULL;
    rtmp->Link.app.av_val = NULL;
    rtmp->Link.flashVer.av_val = NULL;
    if (rtmp->Link.usherToken.av_val) {
      free(rtmp->Link.usherToken.av_val);
      rtmp->Link.usherToken.av_val = NULL;
    }

    RTMP_Free(rtmp);
  }
}

void RTMPClient::ParsePacket(RTMP *r, const RTMPPacket *packet)
{
  LOG_DEBUG("%s, received packet type %02X, size %u bytes.\n", __FUNCTION__,
    packet->m_packetType, packet->m_nBodySize);

  auto Func = Functions[packet->m_packetType];
  if (Func) {
    (this->*Func)(r, packet);
  }
}

int RTMPClient::SendConnectResult(RTMP *r, double txn)
{
  RTMPPacket packet;
  char pbuf[384], *pend = pbuf + sizeof(pbuf);
  AMFObject obj;
  AMFObjectProperty p, op;
  AVal av;

  packet.m_nChannel = 0x03; // control channel (invoke)
  packet.m_headerType = RTMP_PACKET_SIZE_MEDIUM;
  packet.m_packetType = RTMP_PACKET_TYPE_INVOKE;
  packet.m_nTimeStamp = 0;
  packet.m_nInfoField2 = 0;
  packet.m_hasAbsTimestamp = 0;
  packet.m_body = pbuf + RTMP_MAX_HEADER_SIZE;

  char *enc = packet.m_body;
  enc = AMF_EncodeString(enc, pend, &av__result);
  enc = AMF_EncodeNumber(enc, pend, txn);
  *enc++ = AMF_OBJECT;

  STR2AVAL(av, "FMS/3,5,1,525");
  enc = AMF_EncodeNamedString(enc, pend, &av_fmsVer, &av);
  enc = AMF_EncodeNamedNumber(enc, pend, &av_capabilities, 31.0);
  enc = AMF_EncodeNamedNumber(enc, pend, &av_mode, 1.0);
  *enc++ = 0;
  *enc++ = 0;
  *enc++ = AMF_OBJECT_END;

  *enc++ = AMF_OBJECT;
  STR2AVAL(av, "status");
  enc = AMF_EncodeNamedString(enc, pend, &av_level, &av);
  STR2AVAL(av, "NetConnection.Connect.Success");
  enc = AMF_EncodeNamedString(enc, pend, &av_code, &av);
  STR2AVAL(av, "Connection succeeded.");
  enc = AMF_EncodeNamedString(enc, pend, &av_description, &av);
  enc = AMF_EncodeNamedNumber(enc, pend, &av_objectEncoding, r->m_fEncoding);
  STR2AVAL(p.p_name, "version");
  STR2AVAL(p.p_vu.p_aval, "3,5,1,525");
  p.p_type = AMF_STRING;
  obj.o_num = 1;
  obj.o_props = &p;
  op.p_type = AMF_OBJECT;
  STR2AVAL(op.p_name, "data");
  op.p_vu.p_object = obj;
  enc = AMFProp_Encode(&op, enc, pend);
  *enc++ = 0;
  *enc++ = 0;
  *enc++ = AMF_OBJECT_END;

  packet.m_nBodySize = enc - packet.m_body;

  return RTMP_SendPacket(r, &packet, FALSE);
}

int RTMPClient::SendResultNumber(RTMP *r, double txn, double ID)
{
  RTMPPacket packet;
  char pbuf[256], *pend = pbuf + sizeof(pbuf);

  packet.m_nChannel = 0x03; // control channel (invoke)
  packet.m_headerType = RTMP_PACKET_SIZE_MEDIUM;
  packet.m_packetType = RTMP_PACKET_TYPE_INVOKE;
  packet.m_nTimeStamp = 0;
  packet.m_nInfoField2 = 0;
  packet.m_hasAbsTimestamp = 0;
  packet.m_body = pbuf + RTMP_MAX_HEADER_SIZE;

  char *enc = packet.m_body;
  enc = AMF_EncodeString(enc, pend, &av__result);
  enc = AMF_EncodeNumber(enc, pend, txn);
  *enc++ = AMF_NULL;
  enc = AMF_EncodeNumber(enc, pend, ID);

  packet.m_nBodySize = enc - packet.m_body;

  return RTMP_SendPacket(r, &packet, FALSE);
}

int RTMPClient::SendOnFCPublish(RTMP *r, double txn)
{
  RTMPPacket packet;
  char pbuf[256], *pend = pbuf + sizeof(pbuf);
  AVal av;

  packet.m_nChannel = 0x03; // control channel (invoke)
  packet.m_headerType = RTMP_PACKET_SIZE_MEDIUM;
  packet.m_packetType = RTMP_PACKET_TYPE_INVOKE;
  packet.m_nTimeStamp = 0;
  packet.m_nInfoField2 = 0;
  packet.m_hasAbsTimestamp = 0;
  packet.m_body = pbuf + RTMP_MAX_HEADER_SIZE;

  char *enc = packet.m_body;
  enc = AMF_EncodeString(enc, pend, &av_onFCPublish);
  enc = AMF_EncodeNumber(enc, pend, txn);
  *enc++ = AMF_NULL;
  enc = AMF_EncodeNumber(enc, pend, 1);

  *enc++ = AMF_OBJECT;
  STR2AVAL(av, "status");
  enc = AMF_EncodeNamedString(enc, pend, &av_level, &av);
  STR2AVAL(av, "NetStream.Publish.Start");
  enc = AMF_EncodeNamedString(enc, pend, &av_code, &av);
  STR2AVAL(av, "FCPublish to stream.");
  enc = AMF_EncodeNamedString(enc, pend, &av_description, &av);
  *enc++ = AMF_OBJECT_END;

  packet.m_nBodySize = enc - packet.m_body;

  return RTMP_SendPacket(r, &packet, FALSE);
}

void RTMPClient::ParseConnectAMFProp(RTMP *r, AMFObject *cobj)
{
  AVal pname, pval;

  for (int i = 0; i < cobj->o_num; i++) {
    pname = cobj->o_props[i].p_name;
    pval.av_val = NULL;
    pval.av_len = 0;
    if (cobj->o_props[i].p_type == AMF_STRING) {
      pval = cobj->o_props[i].p_vu.p_aval;
    }

    if (AVMATCH(&pname, &av_app)) {
      r->Link.app = pval;
      pval.av_val = NULL;
      if (!r->Link.app.av_val) {
        r->Link.app.av_val = "";
      }
    } else if (AVMATCH(&pname, &av_flashVer)) {
      r->Link.flashVer = pval;
      pval.av_val = NULL;
    } else if (AVMATCH(&pname, &av_swfUrl)) {
      r->Link.swfUrl = pval;
      pval.av_val = NULL;
    } else if (AVMATCH(&pname, &av_tcUrl)) {
      r->Link.tcUrl = pval;
      pval.av_val = NULL;
    } else if (AVMATCH(&pname, &av_pageUrl)) {
      r->Link.pageUrl = pval;
      pval.av_val = NULL;
    } else if (AVMATCH(&pname, &av_audioCodecs)) {
      r->m_fAudioCodecs = cobj->o_props[i].p_vu.p_number;
    } else if (AVMATCH(&pname, &av_videoCodecs)) {
      r->m_fVideoCodecs = cobj->o_props[i].p_vu.p_number;
    } else if (AVMATCH(&pname, &av_objectEncoding)) {
      r->m_fEncoding = cobj->o_props[i].p_vu.p_number;
    }
  }
}

void RTMPClient::ParseAMFObject(RTMP *r, AMFObject *obj)
{
  AVal method;
  AMFProp_GetString(AMF_GetProp(obj, NULL, 0), &method);
  double txn = AMFProp_GetNumber(AMF_GetProp(obj, NULL, 1));
  LOG_DEBUG("%s, client invoking <%s>\n", __FUNCTION__, method.av_val);

  if (AVMATCH(&method, &av_connect)) {
    AMFObject cobj;
    AMFProp_GetObject(AMF_GetProp(obj, NULL, 2), &cobj);
    ParseConnectAMFProp(r, &cobj);
    SendConnectResult(r, txn);
  } else if (AVMATCH(&method, &av_createStream)) {
    SendResultNumber(r, txn, ++mStreamID);
  } else if (AVMATCH(&method, &av_getStreamLength)) {
    SendResultNumber(r, txn, 10.0);
  } else if (AVMATCH(&method, &av_releaseStream)) {
    AVal playPath;
    AMFProp_GetString(AMF_GetProp(obj, NULL, 3), &playPath);
  } else if (AVMATCH(&method, &av_FCPublish)) {
    AMFProp_GetString(AMF_GetProp(obj, NULL, 3), &r->Link.playpath);
    if (mListener && mListener->onStreamKey(this, r->Link.playpath.av_val)) {
      streamKey = r->Link.playpath.av_val;
      SendOnFCPublish(r, txn);
    } else {
      disconnect();
    }
  } else if (AVMATCH(&method, &av_NetStream_Authenticate_UsherToken)) {
    AVal usherToken;
    AMFProp_GetString(AMF_GetProp(obj, NULL, 3), &usherToken);
    RTMPUtility::AVreplace(&usherToken, &av_dquote, &av_escdquote);
    r->Link.usherToken = usherToken;
  } else if (AVMATCH(&method, &av_publish)) {
    SendResultNumber(r, txn, ++mStreamID);
  } else if (AVMATCH(&method, &av_play)) {
    AMFProp_GetString(AMF_GetProp(obj, NULL, 3), &r->Link.playpath);
    if (mListener && mListener->onStreamKey(this, r->Link.playpath.av_val)) {
      streamKey = r->Link.playpath.av_val;
      SendResultNumber(r, txn, ++mStreamID);
    } else {
      disconnect();
    }
  }
}

void RTMPClient::HandleChangeChunkSize(RTMP *rtmp, const RTMPPacket *packet)
{
  if (packet->m_nBodySize >= 4) {
    rtmp->m_inChunkSize = AMF_DecodeInt32(packet->m_body);
    LOG_DEBUG("%s, received: chunk size change to %d.\n", __FUNCTION__, rtmp->m_inChunkSize);
  }
}

void RTMPClient::HandleInvoke(RTMP *r, const RTMPPacket *packet)
{
  const char *body = packet->m_body;
  unsigned int nBodySize = packet->m_nBodySize;

  if (body[0] != 0x02) {
    LOG_WARN("%s, Sanity failed. no string method in invoke packet\n", __FUNCTION__);
    return;
  }

  AMFObject obj;
  int nRes = AMF_Decode(&obj, body, nBodySize, FALSE);
  if (nRes >= 0) {
    ParseAMFObject(r, &obj);
    AMF_Reset(&obj);
  } else {
    LOG_ERROR("%s, error decoding invoke packet.\n", __FUNCTION__);
  }
}

void RTMPClient::HandleInfo(RTMP *r, const RTMPPacket *packet)
{
  const char *body = packet->m_body;
  uint32_t nBodySize = packet->m_nBodySize;

  // TODO: 未実装

LOG_INFO("   INFO: ");
for (int i = 0; i < 20; i++) {
  LOG_INFO(" 0x%02x", (unsigned char) body[i]);
}
LOG_INFO("   size=%d\n", nBodySize);
}

// https://ossrs.io/lts/en-us/assets/files/video_file_format_spec_v10_1-95842d5d9c6e7091c510b72655ea9df7.pdf
// 
// E.4.2.1 AUDIODATA
// +-------------+-----------+-----------+-----------+---------------+--------------
// | SoundFormat | SoundRate | SoundSize | SoundType | AACPacketType | AudioTagBody
// |    UB[4]    |   UB[2]   |   UI[1]   |    UB[1]  |     UI8       |
// +-------------+-----------+-----------+-----------+---------------+--------------


void RTMPClient::HandleAudio(RTMP *r, const RTMPPacket *packet)
{
  const char *body = packet->m_body;
  uint32_t nBodySize = packet->m_nBodySize;
  uint32_t timestamp = packet->m_nTimeStamp;

  int SoundFormat = ((body[0] >> 4) & 0x0F);
  int SoundRate = ((body[0] >> 2) & 0x03);
  int SoundSize = ((body[0] >> 1) & 0x01);
  int SoundType = (body[0] & 0x01);

  if (SoundFormat == RTMP_AUDIO_FORMAT_AAC) {
    int AACPacketType = body[1];
    if (AACPacketType == RTMP_AUDIO_AAC_PACKET_TYPE_AAC_SEQUENCE_HEADER) {
      // AAC sequence header
      // https://csclub.uwaterloo.ca/~ehashman/ISO14496-3-2009.pdf
      // 1.6.2.1 AudioSpecificConfig 
      AudioSpecificConfigParser::parse((const uint8_t *)&body[2], nBodySize - 2, &mAacConfig);
      if (mListener) {
        mListener->onReceivedAudioConfig(this, &mAacConfig);
      }
      conv.init(&mAacConfig);
    } else if (AACPacketType == RTMP_AUDIO_AAC_PACKET_TYPE_AAC_RAW) {
      // AAC raw
      // if (mListener) {
      //   mListener->OnReceivedAudioData(this, (const uint8_t *)&body[2], nBodySize - 2, timestamp);
      // }

      // タイムスタンプ: frameSize/sampleRate = 1024/48000 = 0.021秒 = 21ms
      // OBS からは、21ms ごとに送られてきているっぽい。

      // AAC を Opus に変換をかけて配信します。
      if (mListener) {
        if (conv.decode((const uint8_t *)&body[2], nBodySize - 2) < 0) {
          LOG_ERROR("error\n");
        }
        uint8_t encodeData[20 * 1024];
        int32_t encodeSize = 0;
        while ((encodeSize = conv.encode(encodeData, 20 * 1024)) > 0) {
          mListener->onReceivedAudioData(this, (const char *)encodeData, encodeSize, timestamp);
        }
      }
    }
  } else {
    LOG_ERROR("SoundFormat not supported. SoundFormat: %d, SoundRate: %d SoundSize: %d SoundType: %d\n", 
          SoundFormat, SoundRate, SoundSize, SoundType);
  }
}

// https://ossrs.io/lts/en-us/assets/files/video_file_format_spec_v10_1-95842d5d9c6e7091c510b72655ea9df7.pdf
// 
// E.4.3.1 VIDEODATA
// +-----------+---------+--------------+-----------------+----------------
// | FrameType | CodecId | AVPacketType | CompositionTime | VideoTagBody
// |   UB[4]   |  UB[4]  |     UI[8]    |      SI24       |
// +-----------+---------+--------------+-----------------+----------------

void RTMPClient::HandleVideo(RTMP *r, const RTMPPacket *packet)
{
  const char *body = packet->m_body;
  uint32_t nBodySize = packet->m_nBodySize;
  uint32_t timestamp = packet->m_nTimeStamp;

  int FrameType = ((body[0] >> 4) & 0x0F);
  int CodecId = (body[0] & 0x0F);

  if (CodecId == RTMP_VIDEO_CODEC_ID_AVC) {
    uint8_t AVCPacketType = body[1];
    uint32_t CompositionTime = ((body[2] & 0xFF) << 16) | ((body[3] & 0xFF) << 8) | (body[4] & 0xFF);

    // VideoTagBody
    if (AVCPacketType == RTMP_VIDEO_AVC_PACKET_TYPE_AVC_HEADER) {
      // AVC sequence header
      AVCDecoderConfigurationRecordParser::parse(&body[5], nBodySize - 5, &mAvcConfig);
      if (mListener) {
        mListener->onReceivedVideoConfig(this, &mAvcConfig);
      }
    } else if (AVCPacketType == RTMP_VIDEO_AVC_PACKET_TYPE_AVC_NALU) {
      // AVC NALU
      const char *nalBytes = &body[5];
      size_t nalByteSize = nBodySize - 5;
      uint32_t index = 0;
      int NALUnitLen = mAvcConfig.lengthSizeMinusOne + 1;

      // NAL Unit ごとに分解して、リスナーに通知します。
      while (index < nalByteSize) {
        uint32_t NALUnitSize = 0;
        for (int i = 0; i < NALUnitLen; i++) {
          NALUnitSize <<= 8;
          NALUnitSize |= (nalBytes[index++] & 0xFF);
        }

        if (mListener) {
          mListener->onReceivedVideoData(this, &nalBytes[index], NALUnitSize, timestamp);
        }

        index += NALUnitSize;
      }
    } else if (AVCPacketType == RTMP_VIDEO_AVC_PACKET_TYPE_AVC_EOS) {
      // AVC end sequence
      // TODO: 未実装
    }
  } else {
    LOG_ERROR("This CodecId is not supported. FrameType=%d CodecId=%d \n", FrameType, CodecId);
  }
}

void RTMPClient::HandleCtrl(RTMP *r, const RTMPPacket *packet)
{
  LOG_INFO("@@ HandleCtrl \n");
}

void RTMPClient::HandleServerBW(RTMP *r, const RTMPPacket *packet)
{
  LOG_INFO("@@ HandleServerBW \n");
}

void RTMPClient::HandleClientBW(RTMP *r, const RTMPPacket *packet)
{
  LOG_INFO("@@ HandleClientBW \n");
}

void RTMPClient::HandleUnimplement(RTMP *r, const RTMPPacket *packet)
{
  LOG_INFO("@@ HandleUnimplement \n");
}
