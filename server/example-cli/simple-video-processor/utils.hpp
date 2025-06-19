#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <filesystem>
#include <functional>
#include <iostream>
#include <stdexcept>
#include <string>
#include <system_error>
#include <tuple>

std::size_t get_filesize(const std::string &path) {
  std::size_t size = 0;
  if (std::filesystem::exists(path)) {
    std::error_code ec;
    size = std::filesystem::file_size(path, ec);
    if (ec) {
      std::cerr << "Error getting file size: " << ec.message() << std::endl;
      return 0;
    }
  } else {
    std::cerr << "File does not exist: " << path << std::endl;
  }
  return size;
}

std::size_t get_number_of_frames_to_process(const std::string &video_file,
                                            std::uint32_t frame_size,
                                            std::size_t max_frames) {
  if (video_file.empty()) {
    return max_frames;
  }
  const std::size_t file_size = get_filesize(video_file);
  if (file_size <= 0) {
    return 0;
  }
  const auto total_frames = (file_size / frame_size);
  if (max_frames == 0) {
    return total_frames;
  }
  return std::min(total_frames, max_frames);
}

double get_frame_duration_ms_from_fps(const std::string &fps_str) {
  double _frames = 0;
  double _duration = 1000.0;

  try {
    _frames = std::stod(fps_str);
  } catch (const std::invalid_argument &) {
    std::cerr << "Failed to obtain number from the -fps argument: " << fps_str
              << std::endl;
    throw;
  }
  const auto it = fps_str.find('/');
  if (it != std::string::npos && it + 1 < fps_str.size()) {
    const auto denominator = fps_str.substr(it + 1);
    try {
      _duration = std::stod(denominator) * 1000.0; // Seconds to Milliseconds
    } catch (const std::invalid_argument &) {
      std::cerr << "Failed to obtain the denominator from the -fps argument: "
                << denominator << std::endl;
      throw;
    }
  }

  return _duration / _frames;
}

std::tuple<std::FILE *, std::FILE *>
open_files(const std::string &input_file, const std::string &output_file) {
  FILE *file_read = nullptr;
  FILE *file_save = nullptr;

  if (input_file.empty()) {
    file_read = std::freopen(nullptr, "rb", stdin);
    std::setvbuf(stdin, nullptr, _IONBF, 0);
  } else {
    file_read = fopen(input_file.c_str(), "rb");
    std::cerr << "input video file: " << input_file << std::endl;
  }
  if (output_file.empty()) {
    file_save = std::freopen(nullptr, "wb", stdout);
    std::setvbuf(stdout, nullptr, _IONBF, 0);
  } else {
    file_save = std::fopen(output_file.c_str(), "wb");
  }

  return {file_read, file_save};
}

class Defer {
public:
  explicit Defer(std::function<void()> func) : func_(std::move(func)) {}
  ~Defer() { func_(); }

private:
  std::function<void()> func_;
};
