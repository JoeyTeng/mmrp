#ifndef SIMPLE_VIDEO_PROCESSOR_H
#define SIMPLE_VIDEO_PROCESSOR_H

#include <stdint.h>

// Platform-specific export/import macros
#if defined(_WIN32) || defined(_WIN64)
#ifdef SIMPLE_VIDEO_PROCESSOR_EXPORTS
#define SIMPLE_VIDEO_PROCESSOR_API __declspec(dllexport)
#else
#define SIMPLE_VIDEO_PROCESSOR_API __declspec(dllimport)
#endif
#else
#define SIMPLE_VIDEO_PROCESSOR_API
#endif

// Example function declaration
#ifdef __cplusplus
extern "C" {
#endif

enum VideoFormat {
  VIDEO_FORMAT_YUV420P = 0,
  VIDEO_FORMAT_BGR24,
  VIDEO_FORMAT_UNKNOWN
};

enum ProcessingMode {
  PROCESSING_MODE_IDENTITY = 0,
  PROCESSING_MODE_PIXEL_WISE_ARITHMETICS,
  PROCESSING_MODE_SCALING,
  PROCESSING_MODE_UNKNOWN
};

struct PixelWiseArithmeticsParameters {
  uint8_t y;
  uint8_t u;
  uint8_t v;
  enum OpType { ADDITION = 0, SUBTRACTION, MULTIPLICATION } operator_;
};

struct PictureInfo {
  uint8_t *y;
  uint8_t *u;
  uint8_t *v;
  uint32_t y_height;
  uint32_t y_width;
  uint32_t y_stride;
  uint32_t uv_height;
  uint32_t uv_width;
  uint32_t uv_stride;
  uint32_t duration_ms;
  VideoFormat format;
};

enum ERROR_CODE {
  ERROR_CODE_SUCCESS = 0,
  ERROR_CODE_INVALID_ARGUMENTS,
  ERROR_CODE_UNSUPPORTED_FORMAT,
  ERROR_CODE_PROCESSING_FAILED,
  ERROR_CODE_STRIDE_MISMATCH,
  ERROR_CODE_UNIMPLEMENTED,
  ERROR_CODE_UNKNOWN
};

typedef void *ContextT;

SIMPLE_VIDEO_PROCESSOR_API uint32_t version();

SIMPLE_VIDEO_PROCESSOR_API ERROR_CODE init(ContextT *ctx,
                                           const ProcessingMode mode,
                                           void const *parameters);
SIMPLE_VIDEO_PROCESSOR_API ERROR_CODE process(ContextT ctx,
                                              const PictureInfo *src,
                                              PictureInfo *dst);
SIMPLE_VIDEO_PROCESSOR_API void cleanup(ContextT ctx);

#ifdef __cplusplus
}
#endif

#endif // SIMPLE_VIDEO_PROCESSOR_H
