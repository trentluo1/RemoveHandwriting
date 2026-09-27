#!/bin/zsh
set -euo pipefail

ROOT="/Users/trent/Documents/cursor-project/RemoveHandwriting"
PROMO="$ROOT/marketing/youtube-promo"
GEN="$PROMO/generated"
FFMPEG="/private/tmp/removehandwriting-video-tools/node_modules/ffmpeg-static/ffmpeg"

node "$PROMO/generate-assets.mjs"

if [[ ! -s "$GEN/voiceover.aiff" ]] || [[ $(stat -f%z "$GEN/voiceover.aiff") -lt 100000 ]]; then
  say -v Samantha -r 172 -f "$PROMO/voiceover.txt" -o "$GEN/voiceover.aiff"
fi

"$FFMPEG" -y \
  -loop 1 -t 5.5 -i "$GEN/01-hook.png" \
  -loop 1 -t 7.0 -i "$GEN/02-before-after.png" \
  -loop 1 -t 6.0 -i "$GEN/03-how.png" \
  -loop 1 -t 6.5 -i "$GEN/04-modes.png" \
  -loop 1 -t 6.0 -i "$GEN/05-pdf.png" \
  -loop 1 -t 6.5 -i "$GEN/06-mobile.png" \
  -loop 1 -t 6.0 -i "$GEN/07-privacy.png" \
  -loop 1 -t 6.5 -i "$GEN/08-cta.png" \
  -i "$GEN/voiceover.aiff" \
  -f lavfi -t 50 -i "sine=frequency=110:sample_rate=48000" \
  -filter_complex "\
    [0:v]scale=2000:1125,crop=1920:1080:x='40+12*sin(t*.7)':y='22+8*cos(t*.6)',fps=30,format=yuv420p[v0];\
    [1:v]scale=2000:1125,crop=1920:1080:x='40-18*sin(t*.45)':y='22+8*sin(t*.5)',fps=30,format=yuv420p[v1];\
    [2:v]scale=2000:1125,crop=1920:1080:x='40+10*sin(t*.5)':y='22-7*cos(t*.5)',fps=30,format=yuv420p[v2];\
    [3:v]scale=2000:1125,crop=1920:1080:x='40-12*sin(t*.5)':y='22+6*cos(t*.6)',fps=30,format=yuv420p[v3];\
    [4:v]scale=2000:1125,crop=1920:1080:x='40+13*sin(t*.5)':y='22+8*sin(t*.4)',fps=30,format=yuv420p[v4];\
    [5:v]scale=2000:1125,crop=1920:1080:x='40-14*sin(t*.45)':y='22+7*cos(t*.5)',fps=30,format=yuv420p[v5];\
    [6:v]scale=2000:1125,crop=1920:1080:x='40+10*sin(t*.55)':y='22-7*cos(t*.55)',fps=30,format=yuv420p[v6];\
    [7:v]scale=2000:1125,crop=1920:1080:x='40-10*sin(t*.45)':y='22+7*cos(t*.5)',fps=30,format=yuv420p[v7];\
    [v0][v1]xfade=transition=fade:duration=0.6:offset=4.9[x1];\
    [x1][v2]xfade=transition=slideleft:duration=0.6:offset=11.3[x2];\
    [x2][v3]xfade=transition=fade:duration=0.6:offset=16.7[x3];\
    [x3][v4]xfade=transition=slideup:duration=0.6:offset=22.6[x4];\
    [x4][v5]xfade=transition=fade:duration=0.6:offset=28.0[x5];\
    [x5][v6]xfade=transition=slideleft:duration=0.6:offset=33.9[x6];\
    [x6][v7]xfade=transition=fade:duration=0.6:offset=39.3,format=yuv420p[video];\
    [9:a]volume=.025,lowpass=f=440,afade=t=in:st=0:d=2,afade=t=out:st=47:d=3[music];\
    [8:a]volume=1.35,highpass=f=80,acompressor=threshold=.12:ratio=2.5:attack=20:release=250[voice];\
    [music][voice]amix=inputs=2:duration=longest:dropout_transition=2,alimiter=limit=.95,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[audio]" \
  -map "[video]" -map "[audio]" \
  -t 45.8 -c:v libx264 -preset medium -crf 18 -profile:v high -level 4.1 \
  -c:a aac -b:a 192k -movflags +faststart \
  "$PROMO/removehandwriting-youtube-promo.mp4"

cp "$GEN/01-hook.png" "$PROMO/thumbnail.png"

"$FFMPEG" -hide_banner -i "$PROMO/removehandwriting-youtube-promo.mp4" -f null -
