import argparse

from flask import Flask, render_template
from flask_socketio import SocketIO
import cv2
import numpy as np
import time

parser = argparse.ArgumentParser(description="YUV Video Streaming Server")
parser.add_argument("--yuv_file", "-i", type=str, required=True, help="Path to the YUV video file")
parser.add_argument("--width", "--w", type=int, default=640, help="Width of the video frame")
parser.add_argument("--height", "--h", type=int, default=480, help="Height of the video frame")
parser.add_argument("--fps", "-r", type=float, default=30.0, help="Frames per second for the video stream")
parser.add_argument("--port", "-p", type=int, default=5000, help="Port to run the server on")
args = parser.parse_args()

app = Flask(__name__)
socketio = SocketIO(app)

# Path to the raw YUV file
YUV_FILE_PATH = args.yuv_file
FRAME_WIDTH = args.width  # Width of the video frame
FRAME_HEIGHT = args.height  # Height of the video frame
FRAME_RATE = 1 / args.fps

@app.route("/")
def index():
    return render_template("index.html")  # Serve the HTML file to the client

def read_yuv_and_stream():
    """Read YUV frames, encode them as PNG, and stream them to the client."""
    with open(YUV_FILE_PATH, "rb") as f:
        frame_size = FRAME_WIDTH * FRAME_HEIGHT * 3 // 2  # YUV 4:2:0
        while True:
            # Read one frame from the file
            yuv_data = f.read(frame_size)
            if not yuv_data:
                break  # End of file

            # Convert YUV to a NumPy array
            yuv_frame = np.frombuffer(yuv_data, dtype=np.uint8).reshape((FRAME_HEIGHT * 3 // 2, FRAME_WIDTH))

            # Convert YUV to BGR (OpenCV format)
            bgr_frame = cv2.cvtColor(yuv_frame, cv2.COLOR_YUV2BGR_I420)

            # Encode the frame as PNG
            _, encoded_frame = cv2.imencode('.png', bgr_frame)
            frame_data = encoded_frame.tobytes()

            # Emit the frame to the WebSocket client
            socketio.emit("frame", frame_data)

            # Wait for the next frame
            time.sleep(FRAME_RATE)

@socketio.on("start_stream")
def handle_stream():
    """Handle client request to start the video stream."""
    socketio.start_background_task(read_yuv_and_stream)

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=args.port)
