# Supported video formats and their media types
VIDEO_TYPES = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
}

# Base folder for user data
DATABASE_USER_FOLDER = "app/db/users"

# Folder names inside each session
VIDEOS_FOLDER = "videos"
INPUTS_FOLDER = "inputs"
OUTPUTS_FOLDER = "outputs"

SESSION_TIMEOUT = 60 * 60 * 24 * 90  # 3 months in seconds
CLEANER_TIMEOUT = 60 * 60 * 24
