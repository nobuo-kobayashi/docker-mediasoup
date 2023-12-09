#include "RTMPServer.h"
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <string.h>
#include <memory>

RTMPServer::RTMPServer()
{
  mServState = SERVER_STOPPED;
  mServAddress = "0.0.0.0";
  mServPort = 1935;
  mServSockfd = 0;
  mSslCtx = nullptr;
  mListener = nullptr;
}

RTMPServer::~RTMPServer()
{
  shutdown();
}

void RTMPServer::useSSL(std::string certfile, std::string keyfile)
{
  if (!certfile.empty() && !keyfile.empty()) {
    mSslCtx = RTMP_TLS_AllocServerContext(certfile.c_str(), keyfile.c_str());
  }
}

ServerState RTMPServer::getState()
{
  return mServState;
}

bool RTMPServer::listen(int port)
{
  mServPort = port;

  struct sockaddr_in addr;
  int sockfd, tmp;

  sockfd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
  if (sockfd == -1) {
    return false;
  }

  tmp = 1;
  setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, (char *) &tmp, sizeof(tmp));

  addr.sin_family = AF_INET;
  addr.sin_addr.s_addr = inet_addr(mServAddress.c_str());
  // addr.sin_addr.s_addr = htonl(INADDR_ANY);
  addr.sin_port = htons(port);

  if (bind(sockfd, (struct sockaddr *) &addr, sizeof(struct sockaddr_in)) == -1) {
    ::close(sockfd);
    return false;
  }

  if (::listen(sockfd, 10) == -1) {
    ::close(sockfd);
    return false;
  }

  mServSockfd = sockfd;
  mServState = SERVER_ACCEPTING;

  startThread();

  return true;
}

void RTMPServer::shutdown()
{
  mServState = SERVER_STOPPING;

  stopThread();

  mStreamMap.clear();
  mConnectingStreamMap.clear();

  if (mServSockfd) {
    ::close(mServSockfd);
    mServSockfd = 0;
  }

  if (mSslCtx) {
    RTMP_TLS_FreeServerContext(mSslCtx);
    mSslCtx = nullptr;
  }
}

void RTMPServer::runThread()
{
  LOG_INFO("RTMPServer listen.\n");

  while (!isStopped() && mServState == SERVER_ACCEPTING) {
    struct sockaddr_in addr;
    socklen_t addrlen = sizeof(struct sockaddr_in);
    int sockfd = accept(mServSockfd, (struct sockaddr *) &addr, &addrlen);
    if (sockfd > 0) {
      std::shared_ptr<RTMPClient> client = std::make_shared<RTMPClient>(sockfd);
      if (client) {
        mConnectingStreamMap.add(sockfd, client);
        client->useSSL(mSslCtx);
        client->setListener(this);
        client->startThread();
      } else {
        // 作成に失敗したので、ソケットを閉じておきます。
        LOG_WARN("Failed to create a RTMPClient.\n");
        ::close(sockfd);
      }
    }
  }
  mServState = SERVER_STOPPED;
}

// RTMPClientListener implements.

bool RTMPServer::onStreamKey(RTMPClient *client, std::string streamKey)
{
  LOG_INFO("RTMPServer::onStreamKey: %s\n", streamKey.c_str());

  std::shared_ptr<RTMPClient> connectingClient = mConnectingStreamMap.remove(client->getSockfd());
  if (!connectingClient) {
    LOG_ERROR("RTMPClient not found. streamkey=%s\n", streamKey.c_str());
    return false;
  }

  if (mStreamMap.contains(streamKey)) {
    // 既に接続されている場合は切断を行う
    LOG_ERROR("streamKey=(%s) already connected.\n", streamKey.c_str());
    return false;
  }

  if (mListener && !mListener->onStreamKey(this, streamKey)) {
    // 指定されていないストリームキーが指定された場合
    LOG_ERROR("streamKey=(%s) not found.\n", streamKey.c_str());
    return false;
  }

  mStreamMap.add(streamKey, connectingClient);

  return true;
}

void RTMPServer::onClosed(RTMPClient *client)
{
  LOG_INFO("RTMPServer::onClosed: %s\n", client->streamKey.c_str());

  if (mListener && !client->streamKey.empty()) {
    mListener->onClosed(this, client->streamKey);
  }

  mStreamMap.remove(client->streamKey);
  mConnectingStreamMap.remove(client->getSockfd());
}

void RTMPServer::onReceivedVideoConfig(RTMPClient *client, AVCDecoderConfigurationRecord *config)
{
  if (mListener) {
    mListener->onReceivedVideoConfig(this, client->streamKey, config);
  }
}

void RTMPServer::onReceivedAudioConfig(RTMPClient *client, AudioSpecificConfig *config)
{
  if (mListener) {
    mListener->onReceivedAudioConfig(this, client->streamKey, config);
  }
}

void RTMPServer::onReceivedVideoData(RTMPClient *client, const char *data, uint32_t size, uint32_t timestamp)
{
  if (mListener) {
    mListener->onReceivedVideoData(this, client->streamKey, data, size);
  }
}

void RTMPServer::onReceivedAudioData(RTMPClient *client, const char *data, uint32_t size, uint32_t timestamp)
{
  if (mListener) {
    mListener->onReceivedAudioData(this, client->streamKey, data, size);
  }
}
