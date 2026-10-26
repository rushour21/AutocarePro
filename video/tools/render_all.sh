#!/bin/bash
# Re-renders the five reels and the overview video, and pushes each file to feat/rushabh as soon as it is ready.
cd "$(dirname "$0")/.."
push() { cp "out/reels/$1.mp4" "../media/reels/$1.mp4" && (cd .. && git add -A && git -c user.name=rushabh -c user.email=rushabh.ingle2111@gmail.com commit -q -m "Re-render $1: centred, level layout; no 'Built for Pune garages' line" && git push -u origin feat/rushabh 2>&1 | tail -1); echo "PUSHED $1"; }
tools/render_one.sh Reel1 558 r1 reel-1-tracking && push reel-1-tracking
tools/render_one.sh Reel2 558 r2 reel-2-owner && push reel-2-owner
tools/render_one.sh Reel3 558 r3 reel-3-technician && push reel-3-technician
tools/render_one.sh Reel4 678 r4 reel-4-approval && push reel-4-approval
tools/render_one.sh Reel5 798 r5 reel-5-insurance && push reel-5-insurance
tools/render_one.sh Reel6 2448 r6 video-6-overview 2600 && push video-6-overview
echo ALL-REPUSHED
