# WebSocket-based Video Streaming Example

Example usage:

```
uv run server.py --yuv ${HOME}/Downloads/FourPeople_1280x720_60.yuv --w 1280 --h 720 -r 60 -p 3000
```

## Prompt used

```
Can you generate a minimal example with Python Flask + WebSocket + HTML5, so it: In Python server: 1. reads a raw .yuv file from server devices 2. encode it losslessly into a format that the browser can decode 3. send each frame when they are encoded to the client and in the client, it: 1. render each frame received in the centre 50% of the screen, every 0.1s
```

```
How can I know the actual frame rate achieved at the browser playback?
```

```
Can you provide the complete HTML with this real FPS being displayed on the Web page?
```
