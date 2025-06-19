#include <algorithm>
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <functional>
#include <iomanip>
#include <iostream>
#include <map>
#include <memory>
#include <optional>
#include <string_view>
#include <tuple>

#include "cmdline.h"
#include "simple-video-processor.h"
#include "utils.hpp"

#if defined(_MSC_VER)
#define _CRT_SECURE_NO_WARNINGS
#endif

struct Config { // info for each frame
  std::uint32_t y_height;
  std::uint32_t y_width;
  std::uint32_t y_stride;
  std::uint32_t uv_height;
  std::uint32_t uv_width;
  std::uint32_t uv_stride;
  std::uint32_t frame_duration_ms;
  VideoFormat format;

  constexpr std::uint32_t size() const {
    switch (format) {
    case VIDEO_FORMAT_BGR24:
      return y_height * y_stride * 3; // BGR24 size
    case VIDEO_FORMAT_YUV420P:
      return (y_height * y_stride * 3) >> 1; // YUV420P size
    default:
      std::cerr << "Unsupported video format: " << format << std::endl;
      return 0;
    }
  }

  constexpr double fps() const {
    return 1000.0 / static_cast<double>(frame_duration_ms);
  }
};

std::optional<std::tuple<cmdline::parser, Config>> parse_args(int argc,
                                                              char **argv) {
  cmdline::parser parser;
  parser.add<std::string>("input", 'i', "Input YUV file", false, "");
  parser.add<std::string>("output", 'o', "Output YUV file", false, "");
  parser.add<std::uint32_t>("width", 'w', "Width of Input YUV", true);
  parser.add<std::uint32_t>("height", 'h', "Height of Input YUV", true);
  parser.add<std::string>("fps", 'f', "Frame rate of the input. Default 24/1",
                          false, "24.0");
  parser.add<std::size_t>("frames", 'n', "Number of Frames to process", false,
                          std::numeric_limits<std::size_t>::max());
  parser.add("debug", 'd', "Print debug log");
  parser.add("verbose", 0, "Show progress");

  parser.add<int>("mode", 'm',
                  "Processing mode: identity (0), "
                  "pixel-wise arithmetics (1), scaling (2)",
                  false, ProcessingMode::PROCESSING_MODE_IDENTITY,
                  cmdline::oneof<int, int, int>(
                      ProcessingMode::PROCESSING_MODE_IDENTITY,
                      ProcessingMode::PROCESSING_MODE_PIXEL_WISE_ARITHMETICS,
                      ProcessingMode::PROCESSING_MODE_SCALING));
  parser.add<int>(
      "operator", 0,
      "Pixel-wise arithmetic operator_: addition, subtraction, multiplication",
      false, PixelWiseArithmeticsParameters::OpType::ADDITION,
      cmdline::oneof<int, int, int>(
          PixelWiseArithmeticsParameters::OpType::ADDITION,
          PixelWiseArithmeticsParameters::OpType::SUBTRACTION,
          PixelWiseArithmeticsParameters::OpType::MULTIPLICATION));
  parser.add<int>("y", 0, "Y channel value for pixel-wise operation", false, 0,
                  cmdline::range_reader(0, 255));
  parser.add<int>("u", 0, "U channel value for pixel-wise operation", false, 0,
                  cmdline::range_reader(0, 255));
  parser.add<int>("v", 0, "V channel value for pixel-wise operation", false, 0,
                  cmdline::range_reader(0, 255));

  try {
    parser.parse_check(argc, argv);
  } catch (const cmdline::early_exit &) {
    return {};
  }

  const Config config{
      .y_height = parser.get<std::uint32_t>("height"),
      .y_width = parser.get<std::uint32_t>("width"),
      .y_stride = parser.get<std::uint32_t>("width"),
      .uv_height = parser.get<std::uint32_t>("height") / 2,
      .uv_width = parser.get<std::uint32_t>("width") / 2,
      .uv_stride = parser.get<std::uint32_t>("width") / 2,
      .frame_duration_ms = static_cast<std::uint32_t>(
          get_frame_duration_ms_from_fps(parser.get<std::string>("fps"))),
      .format = VIDEO_FORMAT_YUV420P,
  };

  return {{parser, config}};
}

std::optional<std::tuple<Config, ContextT>>
init_context(const cmdline::parser &parser, const Config &src,
             std::ostream &log_output) {
  Config dest(src);
  PixelWiseArithmeticsParameters param;
  ContextT context;
  ERROR_CODE ret;

  const ProcessingMode mode =
      static_cast<ProcessingMode>(parser.get<int>("mode"));
  switch (mode) {
  case ProcessingMode::PROCESSING_MODE_IDENTITY:
    log_output << "Processing mode: Identity" << std::endl;
    ret = init(&context, mode, nullptr);
    break;
  case ProcessingMode::PROCESSING_MODE_PIXEL_WISE_ARITHMETICS:
    param = {.y = static_cast<std::uint8_t>(parser.get<int>("y")),
             .u = static_cast<std::uint8_t>(parser.get<int>("u")),
             .v = static_cast<std::uint8_t>(parser.get<int>("v")),
             .operator_ = static_cast<PixelWiseArithmeticsParameters::OpType>(
                 parser.get<int>("operator"))};
    static const std::map<PixelWiseArithmeticsParameters::OpType, std::string>
        op_type_to_string = {
            {PixelWiseArithmeticsParameters::OpType::ADDITION, "+ "},
            {PixelWiseArithmeticsParameters::OpType::SUBTRACTION, "- "},
            {PixelWiseArithmeticsParameters::OpType::MULTIPLICATION, "* "}};

    log_output << "Processing mode: Pixel-wise arithmetic: "
               << op_type_to_string.at(param.operator_) << "("
               << static_cast<int>(param.y) << ", " << static_cast<int>(param.u)
               << ", " << static_cast<int>(param.v) << ")" << std::endl;
    ret = init(&context, mode, &param);
    break;
  case ProcessingMode::PROCESSING_MODE_SCALING:
    std::cerr << "Unimplemented processing mode: Scaling" << std::endl;
    return {};
  default:
    std::cerr << "Unsupported processing mode: " << static_cast<int>(mode)
              << std::endl;
    return {};
  }

  if (ret != ERROR_CODE_SUCCESS) {
    log_output << "Failed to initialize video processor: "
               << static_cast<int>(ret) << std::endl;
    return {};
  }

  return {{dest, context}};
}

std::tuple<std::size_t, std::chrono::steady_clock::duration>
process_video(const ContextT context, const Config &src, const Config &dest,
              std::uint8_t *const pYUV, std::uint8_t *const pYUVDest,
              FILE *const file_read, FILE *const file_save, std::size_t frames,
              bool verbose, std::ostream &log_output) {
  std::chrono::steady_clock::duration total_time;
  std::size_t total_frame_processed = 0;
  double timestamp = 0.0;
  std::ostringstream log_oss;

  const auto setup_picture_info = [](const Config &cfg,
                                     std::uint8_t *buffer) -> PictureInfo {
    return {
        .y = buffer,
        .u = buffer + cfg.y_height * cfg.y_stride,
        .v = buffer + cfg.y_height * cfg.y_stride +
             (cfg.uv_height * cfg.uv_stride),
        .y_height = cfg.y_height,
        .y_width = cfg.y_width,
        .y_stride = cfg.y_stride,
        .uv_height = cfg.uv_height,
        .uv_width = cfg.uv_width,
        .uv_stride = cfg.uv_stride,
        .duration_ms = static_cast<std::uint32_t>(cfg.frame_duration_ms),
        .format = cfg.format,
    };
  };

  const auto print_progress =
      [&log_output, &log_oss,
       &total_time](std::size_t idx, double timestamp,
                    const std::chrono::steady_clock::duration &frame_time =
                        std::chrono::steady_clock::duration::zero()) {
        const auto prev_length = log_oss.view().size();
        const double total_seconds =
            static_cast<double>(
                std::chrono::duration_cast<std::chrono::milliseconds>(
                    total_time)
                    .count()) /
            1e3;
        const double timestamp_s = timestamp / 1000.0;
        log_oss.str("");
        log_oss << "Processing frame " << std::setw(4) << std::setfill('0')
                << idx + 1 << " at timestamp: " << std::fixed
                << std::setprecision(2) << timestamp_s << " s "
                << "    Total runtime: " << total_seconds << " s";

        if (frame_time != std::chrono::steady_clock::duration::zero()) {
          const double frame_us = static_cast<double>(
              std::chrono::duration_cast<std::chrono::microseconds>(frame_time)
                  .count());
          const double frame_ms = frame_us / 1e3;
          log_oss << ", Frame runtime: " << frame_ms << " ms ";
        }
        log_oss << "    Speed: " << std::setprecision(4)
                << (timestamp_s / total_seconds) << "x";

        log_output << '\r' << log_oss.str();
        if (const auto curr_length = log_oss.view().size();
            curr_length < prev_length) {
          log_output << std::string(prev_length - curr_length, ' ');
        }
        log_output.flush();
      };

  for (std::size_t idx = 0; idx < frames;
       ++idx, timestamp += src.frame_duration_ms) {
    const PictureInfo src_pic(setup_picture_info(src, pYUV));
    PictureInfo dst_pic(setup_picture_info(dest, pYUVDest));

    if (verbose) {
      print_progress(idx, timestamp);
    }

    if (const auto bytes_read = fread(pYUV, 1, src.size(), file_read);
        bytes_read < static_cast<std::size_t>(src.size())) {
      log_output << std::endl
                 << "No more frame to read (" << bytes_read << " < "
                 << src.size() << "), exit" << std::endl;
      break;
    }

    const auto startTime = std::chrono::steady_clock::now();
    if (const auto ret = process(context, &src_pic, &dst_pic);
        ret != ERROR_CODE_SUCCESS) {
      log_output << std::endl << "processing error: " << ret << std::endl;
      break;
    }
    const auto frame_time = std::chrono::steady_clock::now() - startTime;
    total_time += frame_time;
    total_frame_processed++;

    if (verbose) {
      print_progress(idx, timestamp, frame_time);
    }
    fwrite(pYUVDest, dest.size(), 1, file_save);
  }

  return {total_frame_processed, total_time};
}

int main(int argc, char **argv) {
  const auto parser_ret = parse_args(argc, argv);
  if (!parser_ret) {
    return -1;
  }
  auto [parser, config] = parser_ret.value();

  const std::string video_file = parser.get<std::string>("input");
  const std::string des_video_file = parser.get<std::string>("output");

  // const bool debug = parser.exist("debug");
  const bool verbose = parser.exist("verbose");
  if (config.y_width == 0 || config.y_height == 0) {
    std::cerr << "Width and Height must be greater than 0." << std::endl;
    return -1;
  }

  // stdout would be used for binary YUV Stream data if out == NULL.
  auto &log_output = des_video_file.empty() ? std::cerr : std::cout;

  const auto init_context_ret = init_context(parser, config, log_output);
  if (!init_context_ret) {
    return -1;
  }
  const auto [dest, context] = init_context_ret.value();
  Defer cleanup_context([&context]() { cleanup(context); });

  std::unique_ptr<std::uint8_t[]> pYUV(new uint8_t[config.size()]);
  std::unique_ptr<std::uint8_t[]> pYUVDest(new uint8_t[dest.size()]);
  if (!pYUV || !pYUVDest) {
    log_output << "error allocate memory." << std::endl;
    return 1;
  }

  const auto frames = get_number_of_frames_to_process(
      video_file, config.size(), parser.get<std::size_t>("frames"));

  if (frames == 0) {
    log_output << "Warning: frames <= 0, no frame will be processed."
               << std::endl;
  }
  log_output << config.y_width << "x" << config.y_height << ", " << frames
             << " frames, " << std::setprecision(4) << config.fps() << " fps"
             << std::endl;

  auto [file_read, file_save] = open_files(video_file, des_video_file);
  Defer close_file([&file_read, &file_save]() {
    if (file_read) {
      fclose(file_read);
      file_read = nullptr;
    }
    if (file_save) {
      fclose(file_save);
      file_save = nullptr;
    }
  });

  if (!file_read) {
    log_output << "can not open input file: " << video_file << std::endl;
    return -1;
  } else if (!file_save) {
    log_output << "can not open output file: " << des_video_file << std::endl;
    return -1;
  }

  log_output << "start video filter process..." << std::endl;
  const auto [total_frame_processed, total_time] =
      process_video(context, config, dest, pYUV.get(), pYUVDest.get(),
                    file_read, file_save, frames, verbose, log_output);

  if (total_frame_processed > 0) {
    double dElapsed =
        std::chrono::duration_cast<std::chrono::milliseconds>(total_time)
            .count() /
        1e3;
    log_output << std::endl
               << "Video processing completed for " << total_frame_processed
               << " frames in " << dElapsed << " seconds" << std::endl
               << "FPS: "
               << static_cast<double>(total_frame_processed) / dElapsed
               << std::endl;
  }

  return 0;
}
