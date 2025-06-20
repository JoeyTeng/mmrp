from pathlib import Path

# Get path of input video    
def get_video_path(video):
    return Path(__file__).resolve().parent.parent.parent.parent / "client" / "public" / f"{video}.mp4"
