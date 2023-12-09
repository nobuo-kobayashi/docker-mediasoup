#pragma once

#include <cstdio>

#define LOG_LEVEL_TRACE 0
#define LOG_LEVEL_DEBUG 1
#define LOG_LEVEL_INFO 2
#define LOG_LEVEL_WARN 3
#define LOG_LEVEL_ERROR 4
#define LOG_LEVEL_CRITICAL 5
#define LOG_LEVEL_OFF 6

#ifndef LOG_LEVEL
#define LOG_LEVEL LOG_LEVEL_INFO
#endif

#if LOG_LEVEL <= LOG_LEVEL_TRACE
#define LOG_TRACE(...) std::printf(__VA_ARGS__)
#else
#define LOG_TRACE(...) (void)0
#endif

#if LOG_LEVEL <= LOG_LEVEL_DEBUG
#define LOG_DEBUG(...) std::printf(__VA_ARGS__)
#else
#define LOG_DEBUG(...) (void)0
#endif

#if LOG_LEVEL <= LOG_LEVEL_INFO
#define LOG_INFO(...) std::printf(__VA_ARGS__)
#else
#define LOG_INFO(...) (void)0
#endif

#if LOG_LEVEL <= LOG_LEVEL_WARN
#define LOG_WARN(...) std::printf(__VA_ARGS__)
#else
#define LOG_WARN(...) (void)0
#endif

#if LOG_LEVEL <= LOG_LEVEL_ERROR
#define LOG_ERROR(...) std::fprintf(stderr, __VA_ARGS__)
#else
#define LOG_ERROR(...) (void)0
#endif

#if LOG_LEVEL <= LOG_LEVEL_CRITICAL
#define LOG_CRITICAL(...) std::fprintf(stderr, __VA_ARGS__)
#else
#define LOG_CRITICAL(...) (void)0
#endif
