#ifndef SIMPLE_VIDEO_PROCESSOR_H
#define SIMPLE_VIDEO_PROCESSOR_H

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

SIMPLE_VIDEO_PROCESSOR_API void say_hello();

#ifdef __cplusplus
}
#endif

#endif // SIMPLE_VIDEO_PROCESSOR_H
