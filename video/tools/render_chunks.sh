#!/bin/bash
# Renders the film in 5-second chunks (separate processes, stall watchdog + retry), then joins them losslessly.
cd "$(dirname "$0")/.."
TOTAL=${TOTAL:-1730}; CH=${CH:-150}; CONC=${CONC:-3}; START=${START:-0}
COMP=${COMP:-Film}; DIR=${DIR:-out/chunks}; FINAL=${FINAL:-out/silent.mp4}; CRF=${CRF:-18}
mkdir -p "$DIR"
for ((s=START; s<TOTAL; s+=CH)); do
  e=$((s+CH-1)); [ $e -ge $TOTAL ] && e=$((TOTAL-1))
  f=$DIR/c$(printf %05d $s).mp4
  [ -s $f ] && continue
  for try in 1 2 3; do
    echo "chunk $s-$e try $try"
    npx remotion render src/index.ts $COMP $f --frames=$s-$e --codec=h264 --crf=$CRF --concurrency=$CONC --timeout=120000 > $DIR/chunk_$s.log 2>&1 &
    pid=$!; last=""; idle=0
    while kill -0 $pid 2>/dev/null; do
      sleep 10
      cur=$(tr '\r' '\n' < $DIR/chunk_$s.log | grep -o "Rendered [0-9]*/" | tail -1)
      if [ "$cur" = "$last" ]; then idle=$((idle+1)); else idle=0; fi; last="$cur"
      if [ $idle -ge 9 ]; then echo "stalled, killing"; pkill -9 -f "remotion render"; pkill -9 -f compositor-linux; pkill -9 -f chrome-linux/chrome; sleep 2; break; fi
    done
    wait $pid 2>/dev/null
    [ -s $f ] && break
    rm -f $f
  done
  [ -s $f ] || { echo "FAILED chunk $s"; exit 1; }
done
ls $DIR | grep mp4 | sort | sed "s/.*/file '&'/" > $DIR/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i $DIR/list.txt -c copy $FINAL && echo "JOINED $COMP"
