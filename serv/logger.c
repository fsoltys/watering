#include <string.h>
#include <stdio.h>
#include <stdarg.h>

#include "logger.h"

log_lvl log_level = WARN;

const char *log_lvl_print[] = {
  "[" MAGENTA "CRIT" RESET"]",
  "[" RED "ERROR" RESET"]",
  "[" YELLOW "WARN" RESET"]",
  "[" CYAN "INFO" RESET"]",
  "[" GREEN "DEBUG" RESET"]"
};

#define DEFINE_LOG_FUNC(name, llvl) \
  void name(const char *fmt, ...) { \
    va_list arg; \
    va_start (arg, fmt); \
      \
    print_log(llvl, fmt, arg); \
      \
    va_end (arg); \
  }

int
set_log_lvl(log_lvl llvl)
{
  if (llvl < NONE || llvl > DEBUG) {
    return -1;
  }

  log_level = llvl;

  return 0;
}

void
print_log(log_lvl llvl, const char *fmt, va_list args)
{
  if (llvl == NONE) {
    return;
  }

  if (llvl <= log_level) {
    printf("%s\t", log_lvl_print[llvl]);
    vprintf(fmt, args);
  }
}

DEFINE_LOG_FUNC(log_crit, CRIT);
DEFINE_LOG_FUNC(log_err, ERROR);
DEFINE_LOG_FUNC(log_warn, WARN);
DEFINE_LOG_FUNC(log_info, INFO);
DEFINE_LOG_FUNC(log_debug, DEBUG);
