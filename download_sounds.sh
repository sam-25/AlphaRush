#!/bin/bash
DOWNLOAD_DIR="/Users/samarthgattu/Desktop/Projects/AlphaRush/client/public/sounds"
mkdir -p "$DOWNLOAD_DIR"

download() {
  URL=$1
  FILE=$2
  echo "Downloading $FILE..."
  curl -L --connect-timeout 10 --max-time 30 -A "Mozilla/5.0" -o "$DOWNLOAD_DIR/$FILE" "$URL"
  if [ $? -eq 0 ]; then
    echo "Success: $FILE"
  else
    echo "Failed: $FILE"
  fi
}

download "https://assets.mixkit.co/active_storage/sfx/2000/2000.wav" "correct.wav"
download "https://assets.mixkit.co/active_storage/sfx/2053/2053.wav" "wrong.wav"
download "https://assets.mixkit.co/active_storage/sfx/2005/2005.wav" "turn-change.wav"
download "https://assets.mixkit.co/active_storage/sfx/2020/2020.wav" "bomb-explode.wav"
download "https://assets.mixkit.co/active_storage/sfx/2019/2019.wav" "eliminated.wav"
download "https://assets.mixkit.co/active_storage/sfx/2048/2048.wav" "winner.wav"
download "https://assets.mixkit.co/active_storage/sfx/2568/2568.wav" "countdown-tick.wav"
download "https://assets.mixkit.co/active_storage/sfx/2006/2006.wav" "life-gain.wav"

echo "All downloads finished."
