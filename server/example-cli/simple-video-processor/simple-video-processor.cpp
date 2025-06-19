#include "simple-video-processor.h"
#include "simple-video-processor-impl.h"

// Example function definition
#ifdef __cplusplus
extern "C" {
#endif

std::uint32_t version() { return 1; }

ERROR_CODE init(ContextT *ctx, const ProcessingMode mode,
                void const *parameters) {
  if (ctx == nullptr) {
    return ERROR_CODE_INVALID_ARGUMENTS;
  }
  switch (mode) {
  case PROCESSING_MODE_IDENTITY:
    *ctx = new IdentityVideoProcessor();
    return ERROR_CODE_SUCCESS;
  case PROCESSING_MODE_PIXEL_WISE_ARITHMETICS: {
    if (parameters == nullptr) {
      return ERROR_CODE_INVALID_ARGUMENTS;
    }
    const auto params =
        static_cast<const PixelWiseArithmeticsParameters *>(parameters);
    *ctx = new PixelWiseArithmeticVideoProcessor(*params);
    return ERROR_CODE_SUCCESS;
  }
  case PROCESSING_MODE_SCALING:
    return ERROR_CODE_UNIMPLEMENTED;
  default:
    return ERROR_CODE_INVALID_ARGUMENTS;
  }
  return ERROR_CODE_SUCCESS;
}

ERROR_CODE process(ContextT ctx, const PictureInfo *src, PictureInfo *dst) {
  if (ctx == nullptr || src == nullptr || dst == nullptr) {
    return ERROR_CODE_INVALID_ARGUMENTS;
  }

  SimpleVideoProcessor *processor = static_cast<SimpleVideoProcessor *>(ctx);
  if (processor == nullptr) {
    return ERROR_CODE_INVALID_ARGUMENTS;
  }

  return processor->process(src, dst);
}
void cleanup(ContextT ctx) { delete static_cast<SimpleVideoProcessor *>(ctx); }

#ifdef __cplusplus
}
#endif
