#!/bin/bash
# Renders the five reels (chunked, with stall watchdog), muxes the music and writes out/reels/*.mp4 (< 15 MB each).
cd "$(dirname "$0")/.."
mkdir -p out/reels
declare -A FR=([Reel1]=558 [Reel2]=558 [Reel3]=558 [Reel4]=678 [Reel5]=798)
declare -A AU=([Reel1]=r1 [Reel2]=r2 [Reel3]=r3 [Reel4]=r4 [Reel5]=r5)
declare -A NAME=([Reel1]=reel-1-tracking [Reel2]=reel-2-owner [Reel3]=reel-3-technician [Reel4]=reel-4-approval [Reel5]=reel-5-insurance)
for c in ${REELS:-Reel1 Reel2 Reel3 Reel4 Reel5}; do
  [ -s out/reels/${NAME[$c]}.mp4 ] && continue
  COMP=$c TOTAL=${FR[$c]} CH=90 CONC=2 CRF=14 DIR=out/rchunks/$c FINAL=out/reels/$c-silent.mp4 bash tools/render_chunks.sh || { echo "FAILED $c"; exit 1; }
  ffmpeg -y -loglevel error -i out/reels/$c-silent.mp4 -i public/audio/reel_${AU[$c]}.wav -map 0:v -map 1:a -c:v libx264 -preset slow -b:v 4200k -maxrate 5200k -bufsize 9M -pix_fmt yuv420p -r 30 -c:a aac -b:a 160k -t $(python3 -c "print(${FR[$c]}/30)") -movflags +faststart out/reels/${NAME[$c]}.mp4 && echo "MUXED ${NAME[$c]}"
done
echo ALLDONE
