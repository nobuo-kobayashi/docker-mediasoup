#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include "Settings.h"
#include "MediaServer.h"
#include "utils/WebsocketClient.h"
#include "utils/Log.h"

int main(int argc, char *argv[])
{
  int opt;
  Settings settings;

  // getopt()のエラーメッセージを無効にする。
  opterr = 0;

  while ((opt = getopt(argc, argv, "dc:")) != -1) {
    switch (opt) {
      case 'd':
        RTMP_LogSetLevel(RTMP_LOGDEBUG);
        RTMP_LogSetLevel(RTMP_LOGALL);
        break;
      case 'c':
        {
          std::string configFile((char *)optarg);
          SettingsLoader::load(configFile, &settings);
          SettingsLoader::print(&settings);
        }
        break;
      default:
        LOG_INFO("Usage: %s [-d] [-c config-file] arg1 ...\n", argv[0]);
        break;
    }
  }

  // mediasoup が起動するのに少し待機します。
  sleep(5);

  MediaServer main(settings);
  main.process();

  WebsocketClient::loopMain();

  return 0;
}
