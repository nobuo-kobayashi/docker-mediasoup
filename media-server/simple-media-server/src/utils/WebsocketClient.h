#pragma once

#include <string>
#include <vector>
#include <libsoup/soup.h>

// そのうち切り替える
// https://github.com/civetweb/civetweb

class WebsocketClient;

class WebsocketClientListener {
public:
  virtual void onConnected(WebsocketClient *client) {}
  virtual void onDisconnected(WebsocketClient *client) {}
  virtual void onFailedToConnect(WebsocketClient *client) {}
  virtual void onMessage(WebsocketClient *client, std::string& message) {}
};

typedef enum {
  Disconnected,
  Connecting,
  Connected
} WSState;

class WebsocketClient {
private:
  SoupWebsocketConnection *mConnection;
  WebsocketClientListener *mListener;

  gint mDisconnectHandleId;
  gint mMessageHandleId;

  WSState mState;

  static void onServerConnected(SoupSession *session, GAsyncResult *res, gpointer userData);
  static void onServerClosed(SoupWebsocketConnection *conn G_GNUC_UNUSED, gpointer userData);
  static void onServerMessage(SoupWebsocketConnection *conn, SoupWebsocketDataType type, GBytes *message, gpointer userData);

public:
  WebsocketClient();
  virtual ~WebsocketClient();

  inline void setListener(WebsocketClientListener *listener) {
    mListener = listener;
  }

  bool isConnected();
  void connectAsync(std::string& url, std::string& origin);
  void connectAsync(std::string& url, std::string& origin, std::vector<std::string>& protocols);
  void connectAsync(std::string& url, std::string& origin, std::vector<std::string>& protocols, std::string& userAgent, bool isLogger);
  void disconnect();
  void sendMessage(std::string& message);

  static void loopMain();
};
