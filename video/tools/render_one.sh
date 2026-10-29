#!/bin/bash
# usage: render_one.sh <Composition> <frames> <audio key> <out name> [video kbps]
cd "$(dirname "$0")/.."
C=$1; N=$2; AU=$3; NAME=$4; KB=${5:-4200}
mkdir -p out/reels
COMP=$C TOTAL=$N CH=90 CONC=2 CRF=14 DIR=out/rchunks/$C FINAL=out/reels/$C-silent.mp4 bash tools/render_chunks.sh || { echo "FAILED $C"; exit 1; }
ffmpeg -y -loglevel error -i out/reels/$C-silent.mp4 -i public/audio/reel_${AU}.wav -map 0:v -map 1:a -c:v libx264 -preset slow -b:v ${KB}k -maxrate $((KB*5/4))k -bufsize 9M -pix_fmt yuv420p -r 30 -c:a aac -b:a 160k -t $(python3 -c "print($N/30)") -movflags +faststart out/reels/$NAME.mp4 && echo "MUXED $NAME"
