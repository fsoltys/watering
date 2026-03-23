#pragma once

#include <stdarg.h>

#define RESET   "\033[0m"
#define BLACK   "\033[30m"
#define RED     "\033[31m"
#define GREEN   "\033[32m"
#define YELLOW  "\033[33m"
#define BLUE    "\033[34m"
#define MAGENTA "\033[35m"
#define CYAN    "\033[36m"
#define WHITE   "\033[37m"

typedef enum log_lvl {
  NONE=-1,
  CRIT=0,
  ERROR=1,
  WARN=2,
  INFO=3,
  DEBUG=4
} log_lvl;

extern log_lvl log_level;
void print_log(log_lvl llvl, const char *fmt, va_list args);
int set_log_lvl(log_lvl llvl);

void log_crit(const char *fmt, ...);
void log_err(const char *fmt, ...);
void log_warn(const char *fmt, ...);
void log_info(const char *fmt, ...);
void log_debug(const char *fmt, ...);
