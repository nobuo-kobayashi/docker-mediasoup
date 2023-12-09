#pragma once

#include <map>
#include <memory>
#include <mutex>
#include <string>

template<typename KeyType, typename ValueType>
class SafeMap {
private:
  std::map<KeyType, ValueType> mMap;
  std::mutex mMapMutex;

public:
  SafeMap() {
  }

  ~SafeMap() {
    clear();
  }

  bool contains(KeyType key) {
    std::lock_guard<std::mutex> lock(mMapMutex);
    return mMap.count(key) > 0;
  }

  bool add(KeyType key, ValueType value) {
    std::lock_guard<std::mutex> lock(mMapMutex);
    if (mMap.count(key) > 0) {
      return false;
    } else {
      mMap.insert(std::make_pair(key, value));
      return true;
    }
  }

  ValueType remove(KeyType key) {
    std::lock_guard<std::mutex> lock(mMapMutex);
    if (mMap.count(key) > 0) {
      auto value = mMap.at(key);
      mMap.erase(key);
      return value;
    }
    return nullptr;
  }

  ValueType get(KeyType key) {
    std::lock_guard<std::mutex> lock(mMapMutex);
    if (mMap.count(key) > 0) {
      return mMap.at(key);
    }
    return nullptr;
  }

  void clear() {
    std::lock_guard<std::mutex> lock(mMapMutex);
    mMap.clear();
  }
};
