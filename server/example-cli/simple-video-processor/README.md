# Simple Video Processor

## Build

Prerequisites:

- A working C++ compiler that supports C++20 or later.
- CMake >= 3.24. You can install via `pip install cmake`.

Simple command to build (native release binaries):

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

Built binaries will be in the `build` directory.

## Run

For the executable, you can use `--help` to obtain the help messages. A simple example to run the video processor:

```bash
build/simple-video-processor-app -i ~/Downloads/FourPeople_1280x720_60.yuv -w 1280 -h 720 -m 1 --operator 2 --y 1 --u 1 --v 1 -o four.yuv --verbose
```

Multiply all pixels by (1, 1, 1) (YUV channels); i.e., identical.

There's a built-in identity mode `-m 0`.

```bash
build/simple-video-processor-app -i ~/Downloads/FourPeople_1280x720_60.yuv -w 1280 -h 720 -m 0 -o four.yuv --verbose
```

Another example, to make the video black (minus all Y channels by 255, with the clipping effect, it essentially sets them to 0).

```bash
build/simple-video-processor-app -i ~/Downloads/FourPeople_1280x720_60.yuv -w 1280 -h 720 -m 1 --operator 1 --y 255 -o four.yuv --verbose
```

Example of using pipe:

```bash
cat four.yuv | ../build/simple-video-processor-app -w 1280 -h 720 -m 1 --operator 2 --y 1 --u 1 --v 1 --verbose >four-2.yuv
cat four.yuv | ../build/simple-video-processor-app -w 1280 -h 720 -m 1 --operator 2 --y 1 --u 1 --v 1 --verbose | cat >four-2.yuv
```

For the DLL, the header is `simple_video_processor.h`, and the library is something like `libsimple_video_processor.so` (or `.dll` on Windows, `.dylib` on macOS). The APIs are `cleanup`, `init`, `process` and `version`
