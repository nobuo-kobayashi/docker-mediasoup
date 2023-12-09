#pragma once

#include <librtmp/rtmp.h>
#include <librtmp/log.h>
#include <librtmp/amf.h>

enum {
  RTMP_AUDIO_FORMAT_PCM = 0,
  RTMP_AUDIO_FORMAT_ADPCM,
  RTMP_AUDIO_FORMAT_MP3,
  RTMP_AUDIO_FORMAT_PCM_LE,
  RTMP_AUDIO_FORMAT_NELLYMOSER_16KHZ,
  RTMP_AUDIO_FORMAT_NELLYMOSER_8KHZ,
  RTMP_AUDIO_FORMAT_NELLYMOSER,
  RTMP_AUDIO_FORMAT_G711_A_LAW,
  RTMP_AUDIO_FORMAT_G711_MU_LAW,
  RTMP_AUDIO_FORMAT_RESERVED1,
  RTMP_AUDIO_FORMAT_AAC,
  RTMP_AUDIO_FORMAT_SPEEX,
  RTMP_AUDIO_FORMAT_MP3_8KHZ,
  RTMP_AUDIO_FORMAT_DEVICE_SPECIFIC_SOUND,
};

enum {
  RTMP_AUDIO_RATE_5_5KHZ = 0,
  RTMP_AUDIO_RATE_11KHZ,
  RTMP_AUDIO_RATE_22KHZ,
  RTMP_AUDIO_RATE_44KHZ,
};

enum {
  RTMP_AUDIO_SOUND_SIZE_8BIT = 0,
  RTMP_AUDIO_SOUND_SIZE_16BIT,
};

enum {
  RTMP_AUDIO_SOUND_TYPE_MONO = 0,
  RTMP_AUDIO_SOUND_TYPE_STEREO,
};

enum {
  RTMP_AUDIO_AAC_PACKET_TYPE_AAC_SEQUENCE_HEADER = 0,
  RTMP_AUDIO_AAC_PACKET_TYPE_AAC_RAW,
};

enum {
  RTMP_VIDEO_FRAME_TYPE_KEYFRAME = 1,
  RTMP_VIDEO_FRAME_TYPE_INTERFRAME,
  RTMP_VIDEO_FRAME_TYPE_DISPOSABLE_INTERFRAME,
  RTMP_VIDEO_FRAME_TYPE_GENERATED_KEYFRAME,
  RTMP_VIDEO_FRAME_TYPE_VIDEO_INFO,
};

enum {
  RTMP_VIDEO_CODEC_ID_JPEG = 1,
  RTMP_VIDEO_CODEC_ID_SORENSON_H263,
  RTMP_VIDEO_CODEC_ID_SCREEN_VIDEO,
  RTMP_VIDEO_CODEC_ID_ON2_VP6,
  RTMP_VIDEO_CODEC_ID_ON2_VP6_WITH_ALPHA,
  RTMP_VIDEO_CODEC_ID_SCREEN_VIDEO_V2,
  RTMP_VIDEO_CODEC_ID_AVC
};

enum {
  RTMP_VIDEO_AVC_PACKET_TYPE_AVC_HEADER = 0,
  RTMP_VIDEO_AVC_PACKET_TYPE_AVC_NALU,
  RTMP_VIDEO_AVC_PACKET_TYPE_AVC_EOS
};

#define STRINGIFY(name) #name

class RTMPUtility {
private:
  RTMPUtility() {}

public:
  static void AVreplace(AVal *src, const AVal *orig, const AVal *repl);
};