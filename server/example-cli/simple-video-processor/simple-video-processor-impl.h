#ifndef SIMPLE_VIDEO_PROCESSOR_IMPL_H
#define SIMPLE_VIDEO_PROCESSOR_IMPL_H

#include <cstdint>
#include <functional>

#include "simple-video-processor.h"

class SimpleVideoProcessor {
protected:
  using process_t =
      std::function<ERROR_CODE(const PictureInfo *src, PictureInfo *dst)>;

public:
  using pixel_t = std::uint8_t;

  SimpleVideoProcessor(const process_t &process) : process_(process) {}
  virtual ~SimpleVideoProcessor() = default;

  virtual ERROR_CODE process(const PictureInfo *src, PictureInfo *dst);

protected:
  process_t process_;
};

class IdentityVideoProcessor : public SimpleVideoProcessor {
public:
  IdentityVideoProcessor() : SimpleVideoProcessor(process_) {}
  virtual ~IdentityVideoProcessor() = default;

  inline ERROR_CODE process(const PictureInfo *src, PictureInfo *dst) {
    return process_(src, dst);
  }

  static ERROR_CODE process_(const PictureInfo *src, PictureInfo *dst);
};

class PixelWiseArithmeticVideoProcessor : public SimpleVideoProcessor {
public:
  PixelWiseArithmeticVideoProcessor(
      PixelWiseArithmeticsParameters const &params)
      : SimpleVideoProcessor([this](const PictureInfo *src, PictureInfo *dst) {
          return this->process(src, dst);
        }),
        y_plane_process_(generateOp(params.y, params.operator_)),
        u_plane_process_(generateOp(params.u, params.operator_)),
        v_plane_process_(generateOp(params.v, params.operator_)) {}

  virtual ~PixelWiseArithmeticVideoProcessor() = default;

  ERROR_CODE process(const PictureInfo *src, PictureInfo *dst);

private:
  using intermediate_pixel_t = std::int32_t;
  using PlaneProcess =
      std::function<void(pixel_t const *, pixel_t *, std::uint32_t)>;

  static PlaneProcess
  generateOp(const pixel_t &operand,
             const PixelWiseArithmeticsParameters::OpType &operator_);

  const PlaneProcess y_plane_process_;
  const PlaneProcess u_plane_process_;
  const PlaneProcess v_plane_process_;

  static PlaneProcess pixel_wise_addition(const intermediate_pixel_t &operand);
  static PlaneProcess
  pixel_wise_multiplication(const intermediate_pixel_t &operand);
  static pixel_t clamp_pixel_value(intermediate_pixel_t value);
};

#endif // SIMPLE_VIDEO_PROCESSOR_IMPL_H
