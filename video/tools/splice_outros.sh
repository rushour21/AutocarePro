#!/bin/bash
# Re-renders only the closing card of each video (current source: no 'Built for Pune garages') and splices it onto the existing file.
cd "$(dirname "$0")/.."
mkdir -p out/outro out/spliced
splice() { # comp frames name kbps
  local C=$1 N=$2 NAME=$3 KB=$4 F0=$(( $2 - 62 ))
  [ -s out/outro/$C.mp4 ] || npx remotion render src/index.ts $C out/outro/$C.mp4 --frames=$F0-$((N-1)) --codec=h264 --crf=14 --concurrency=2 > out/outro/$C.log 2>&1 || return 1
  ffmpeg -y -loglevel error -i ../media/reels/$NAME.mp4 -i out/outro/$C.mp4 \
    -filter_complex "[0:v]trim=end_frame=$F0,setpts=PTS-STARTPTS,fps=30[a];[1:v]setpts=PTS-STARTPTS,fps=30[b];[a][b]concat=n=2:v=1:a=0[v]" \
    -map "[v]" -map 0:a -c:v libx264 -preset slow -b:v ${KB}k -maxrate $((KB*5/4))k -bufsize 9M -pix_fmt yuv420p -c:a copy -movflags +faststart out/spliced/$NAME.mp4 || return 1
  cp out/spliced/$NAME.mp4 ../media/reels/$NAME.mp4
  (cd .. && git add -A && git -c user.name=rushabh -c user.email=rushabh.ingle2111@gmail.com commit -q -m "Remove 'Built for Pune garages' from the closing card of $NAME" && git push -u origin feat/rushabh 2>&1 | tail -1)
  echo "DONE $NAME"
}
splice Reel1 558 reel-1-tracking 4200
splice Reel2 558 reel-2-owner 4200
splice Reel3 558 reel-3-technician 4200
splice Reel4 678 reel-4-approval 4200
splice Reel5 798 reel-5-insurance 4200
splice Reel6 2448 video-6-overview 2600
echo ALL-SPLICED
