# Minimum CMake version
cmake_minimum_required(VERSION 3.24..3.31)

# Project name and version
project(simple-video-processor VERSION 1.0.0 LANGUAGES CXX)

# Specify the library target
add_library(simple-video-processor SHARED simple-video-processor.cpp)
add_executable(simple-video-processor-app main.cpp)

target_link_libraries(simple-video-processor-app PRIVATE simple-video-processor)

target_compile_options(simple-video-processor PRIVATE
    $<$<CXX_COMPILER_ID:MSVC>:/W4>  # MSVC warning level 4
    $<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall -Wextra -pedantic>  # GCC/Clang warnings
    $<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-g>  # Debug info
)

target_compile_options(simple-video-processor-app PRIVATE
    $<$<CXX_COMPILER_ID:MSVC>:/W4>  # MSVC warning level 4
    $<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall -Wextra -pedantic>  # GCC/Clang warnings
    $<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-g>  # Debug info
)

# Define the library's properties
set_target_properties(simple-video-processor PROPERTIES
    VERSION ${PROJECT_VERSION}
    SOVERSION 1
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED ON
)

set_target_properties(simple-video-processor-app PROPERTIES
    VERSION ${PROJECT_VERSION}
    SOVERSION 1
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED ON
)

# Platform-specific settings
if(WIN32)
    # For Windows, specify the DLL export definitions
    target_compile_definitions(simple-video-processor PRIVATE SIMPLE_VIDEO_PROCESSOR_EXPORTS)
elseif(APPLE)
    # macOS-specific settings (optional)
    set_target_properties(simple-video-processor PROPERTIES
        INSTALL_NAME_DIR "@rpath"
    )
endif()

# Install rules for the library
install(TARGETS simple-video-processor
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
    RUNTIME DESTINATION bin
)
install(FILES simple-video-processor.h DESTINATION include)

# enable_testing()
