#pragma once

#include <string>

class VideoCodecInfo {
public:
  std::string mimeType;
  int payloadType;
  int clockRate;
};


class VideoInfo {
public:
  bool enabled;
  VideoCodecInfo codec;
};


class AudioCodecInfo {
public:
  std::string mimeType;
  int payloadType;
  int clockRate;
  int channels;
  int stereo;
};


class AudioInfo {
public:
  bool enabled;
  AudioCodecInfo codec;
};


class StreamInfo {
public:
  std::string streamKey;
  VideoInfo videoInfo;
  AudioInfo audioInfo;
};
