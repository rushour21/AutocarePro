#!/bin/bash
cd "$(dirname "$0")/.."
tools/render_one.sh Reel1 558 r1 reel-1-tracking
tools/render_one.sh Reel2 558 r2 reel-2-owner
tools/render_one.sh Reel3 558 r3 reel-3-technician
tools/render_one.sh Reel4 678 r4 reel-4-approval
tools/render_one.sh Reel5 798 r5 reel-5-insurance
tools/render_one.sh Reel6 2448 r6 video-6-overview 2600
cd ..
cp video/out/reels/reel-*.mp4 video/out/reels/video-6-overview.mp4 media/reels/
git add -A && git -c user.name=rushabh -c user.email=rushabh.ingle2111@gmail.com commit -q -m "Remove the 'Built for Pune garages' line (and Reel 1's DM button) from the closing cards of all videos" && git push -u origin feat/rushabh 2>&1 | tail -1
echo OUTROS-PUSHED
