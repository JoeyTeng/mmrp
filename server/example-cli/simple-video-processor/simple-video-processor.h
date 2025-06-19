#ifndef SIMPLE_VIDEO_PROCESSOR_H
#define SIMPLE_VIDEO_PROCESSOR_H

#include <cstdint>

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
  std::uint8_t y;
  std::uint8_t u;
  std::uint8_t v;
  enum OpType { ADDITION = 0, SUBTRACTION, MULTIPLICATION } operator_;
};

struct PictureInfo {
  std::uint8_t *y;
  std::uint8_t *u;
  std::uint8_t *v;
  std::uint32_t y_height;
  std::uint32_t y_width;
  std::uint32_t y_stride;
  std::uint32_t uv_height;
  std::uint32_t uv_width;
  std::uint32_t uv_stride;
  std::uint32_t duration_ms;
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

SIMPLE_VIDEO_PROCESSOR_API std::uint32_t version();

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

#endif // SIMPLE_VIDEO_PROCESSOR_H
