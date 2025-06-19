#include <functional>
#include <iostream>

#include "simple-video-processor.h"

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

ERROR_CODE SimpleVideoProcessor::process(const PictureInfo *src,
                                         PictureInfo *dst) {
  if (src == nullptr || dst == nullptr) {
    return ERROR_CODE_INVALID_ARGUMENTS;
  }
  if (src->format != VIDEO_FORMAT_YUV420P) {
    return ERROR_CODE_UNSUPPORTED_FORMAT;
  }
  if (src->y_stride != dst->y_stride || src->uv_stride != dst->uv_stride) {
    return ERROR_CODE_STRIDE_MISMATCH;
  }

  return process_(src, dst);
}

ERROR_CODE IdentityVideoProcessor::process_(const PictureInfo *src,
                                            PictureInfo *dst) {
  std::memcpy(dst->y, src->y, src->y_height * src->y_stride);
  std::memcpy(dst->u, src->u, src->uv_height * src->uv_stride);
  std::memcpy(dst->v, src->v, src->uv_height * src->uv_stride);

  return ERROR_CODE_SUCCESS;
}

ERROR_CODE PixelWiseArithmeticVideoProcessor::process(const PictureInfo *src,
                                                      PictureInfo *dst) {
  if (src == nullptr || dst == nullptr) {
    return ERROR_CODE_INVALID_ARGUMENTS;
  }
  if (src->format != VIDEO_FORMAT_YUV420P) {
    return ERROR_CODE_UNSUPPORTED_FORMAT;
  }
  if (src->y_stride != dst->y_stride || src->uv_stride != dst->uv_stride) {
    return ERROR_CODE_STRIDE_MISMATCH;
  }

  y_plane_process_(src->y, dst->y, src->y_height * src->y_stride);
  u_plane_process_(src->u, dst->u, src->uv_height * src->uv_stride);
  v_plane_process_(src->v, dst->v, src->uv_height * src->uv_stride);

  return ERROR_CODE_SUCCESS;
}

PixelWiseArithmeticVideoProcessor::PlaneProcess
PixelWiseArithmeticVideoProcessor::generateOp(
    const pixel_t &operand,
    const PixelWiseArithmeticsParameters::OpType &operation) {
  switch (operation) {
  case PixelWiseArithmeticsParameters::OpType::ADDITION:
    return pixel_wise_addition(static_cast<intermediate_pixel_t>(operand));
  case PixelWiseArithmeticsParameters::OpType::SUBTRACTION:
    return pixel_wise_addition(-1 * static_cast<intermediate_pixel_t>(operand));
  case PixelWiseArithmeticsParameters::OpType::MULTIPLICATION:
    return pixel_wise_multiplication(
        static_cast<intermediate_pixel_t>(operand));
  default:
    throw std::invalid_argument("Unsupported operation type");
  }
}

PixelWiseArithmeticVideoProcessor::PlaneProcess
PixelWiseArithmeticVideoProcessor::pixel_wise_addition(
    const intermediate_pixel_t &operand) {
  return [operand](pixel_t const *src, pixel_t *dst, std::uint32_t size) {
    for (std::size_t i = 0; i < size; ++i) {
      dst[i] = clamp_pixel_value(static_cast<intermediate_pixel_t>(operand) +
                                 static_cast<intermediate_pixel_t>(src[i]));
    }
  };
}
PixelWiseArithmeticVideoProcessor::PlaneProcess
PixelWiseArithmeticVideoProcessor::pixel_wise_multiplication(
    const intermediate_pixel_t &operand) {
  return [operand](pixel_t const *src, pixel_t *dst, std::uint32_t size) {
    for (std::size_t i = 0; i < size; ++i) {
      dst[i] = clamp_pixel_value(static_cast<intermediate_pixel_t>(operand) *
                                 static_cast<intermediate_pixel_t>(src[i]));
    }
  };
}

PixelWiseArithmeticVideoProcessor::pixel_t
PixelWiseArithmeticVideoProcessor::clamp_pixel_value(
    PixelWiseArithmeticVideoProcessor::intermediate_pixel_t value) {
  return static_cast<pixel_t>(std::max(
      static_cast<intermediate_pixel_t>(std::numeric_limits<pixel_t>::min()),
      std::min(static_cast<intermediate_pixel_t>(
                   std::numeric_limits<pixel_t>::max()),
               value)));
}
