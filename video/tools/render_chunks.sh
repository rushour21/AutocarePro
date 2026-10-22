#!/bin/bash
# Renders the film in 5-second chunks (separate processes, stall watchdog + retry), then joins them losslessly.
cd "$(dirname "$0")/.."
TOTAL=${TOTAL:-1730}; CH=${CH:-150}; CONC=${CONC:-3}; START=${START:-0}
mkdir -p out/chunks
for ((s=START; s<TOTAL; s+=CH)); do
  e=$((s+CH-1)); [ $e -ge $TOTAL ] && e=$((TOTAL-1))
  f=out/chunks/c$(printf %05d $s).mp4
  [ -s $f ] && continue
  for try in 1 2 3; do
    echo "chunk $s-$e try $try"
    npx remotion render src/index.ts Film $f --frames=$s-$e --codec=h264 --crf=18 --concurrency=$CONC --timeout=120000 > out/chunk_$s.log 2>&1 &
    pid=$!; last=""; idle=0
    while kill -0 $pid 2>/dev/null; do
      sleep 10
      cur=$(tr '\r' '\n' < out/chunk_$s.log | grep -o "Rendered [0-9]*/" | tail -1)
      if [ "$cur" = "$last" ]; then idle=$((idle+1)); else idle=0; fi; last="$cur"
      if [ $idle -ge 9 ]; then echo "stalled, killing"; pkill -P $pid; kill $pid; pkill -f chrome-linux/chrome; break; fi
    done
    wait $pid 2>/dev/null
    [ -s $f ] && break
    rm -f $f
  done
  [ -s $f ] || { echo "FAILED chunk $s"; exit 1; }
done
ls out/chunks | sort | sed "s/.*/file 'chunks\/&'/" > out/chunks.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/chunks.txt -c copy out/silent.mp4 && echo "JOINED"
