#include <functional>
#include <iostream>

#include "simple-video-processor-impl.h"

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
