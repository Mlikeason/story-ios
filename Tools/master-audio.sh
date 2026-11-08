#!/bin/sh
# Rebuild listening copies from the untouched originals. Requires FFmpeg on macOS.
set -eu
cd "$(dirname "$0")/.."
render() {
  ffmpeg -nostdin -v error -y -i "AudioMasters/$1" -af "volume=${3}dB,alimiter=limit=0.65:level=false:attack=5:release=85:latency=true" -map_metadata -1 -c:a aac -b:a "$4" -movflags +faststart "Resources/$2"
}
render 01margret.mp3 01-margaret.m4a 27 320k
render 03classrom.mp3 03-classroom.m4a 13.5 192k

# Rain: compression only, with the original timeline, sample rate and channels.
# Apple's highest-quality AAC encoder uses a 160 kbps average bitrate target.
# Keep gain, dynamics and ambient sound unchanged; playback trim stays in the catalog.
ffmpeg -nostdin -v error -y -i AudioMasters/02rain0404.mp3 \
  -map 0:a:0 -map_metadata -1 -c:a aac_at -aac_at_mode abr -aac_at_quality 2 \
  -b:a 160k -movflags +faststart Resources/02-rain-night.m4a
