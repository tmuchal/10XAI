# source tools/env.sh — sets NODE_PATH (playwright) and FFMPEG for the tools
export NODE_PATH=$(npm root -g)
export FFMPEG=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
