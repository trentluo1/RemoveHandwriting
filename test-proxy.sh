#!/usr/bin/env bash

set -euo pipefail

# Domain and token for the image processing proxy
API_DOMAIN="https://removehng-proxy-edaftmmmsx.cn-hongkong.fcapp.run"
API_PATH="/sjccup"
API_TOKEN="tokenData-309i4c9128did50i2ij7c0h71fdg"

# Test image file
IMAGE_FILE="testpaper.jpg"
ENABLE_COMPRESS="${ENABLE_COMPRESS:-true}"
MAX_DIMENSION="${MAX_DIMENSION:-2400}"
JPEG_QUALITY="${JPEG_QUALITY:-75}"

REQUEST_BODY_FILE=""
COMPRESSED_IMAGE_FILE=""
RESPONSE_FILE="response.json"

cleanup() {
  rm -f "$REQUEST_BODY_FILE" "$COMPRESSED_IMAGE_FILE"
}

get_file_size() {
  stat -f%z "$1"
}

format_bytes() {
  awk -v bytes="$1" 'BEGIN {
    if (bytes >= 1024 * 1024) {
      printf "%.2f MB", bytes / 1024 / 1024
    } else if (bytes >= 1024) {
      printf "%.2f KB", bytes / 1024
    } else {
      printf "%d B", bytes
    }
  }'
}

trap cleanup EXIT

if [ ! -f "$IMAGE_FILE" ]; then
  echo "Image file not found: $IMAGE_FILE" >&2
  exit 1
fi

echo "Preparing image..."
ORIGINAL_SIZE_BYTES=$(get_file_size "$IMAGE_FILE")
echo "Original image: $IMAGE_FILE ($(format_bytes "$ORIGINAL_SIZE_BYTES"))"

IMAGE_TO_ENCODE="$IMAGE_FILE"

if [ "$ENABLE_COMPRESS" = "true" ]; then
  echo "Compressing image..."
  compress_start=$(date +%s.%N)
  COMPRESSED_IMAGE_FILE=$(mktemp /tmp/test-proxy-compressed.XXXXXX)

  if sips -s format jpeg -s formatOptions "$JPEG_QUALITY" -Z "$MAX_DIMENSION" "$IMAGE_FILE" --out "$COMPRESSED_IMAGE_FILE" >/dev/null 2>&1; then
    COMPRESSED_SIZE_BYTES=$(get_file_size "$COMPRESSED_IMAGE_FILE")
    compress_end=$(date +%s.%N)
    compress_duration=$(awk "BEGIN {printf \"%.2f\", $compress_end - $compress_start}" 2>/dev/null || echo "0")
    IMAGE_TO_ENCODE="$COMPRESSED_IMAGE_FILE"
    echo "Compressed image: $COMPRESSED_IMAGE_FILE ($(format_bytes "$COMPRESSED_SIZE_BYTES"))"
    echo "Compression time: ${compress_duration}s"
  else
    rm -f "$COMPRESSED_IMAGE_FILE"
    COMPRESSED_IMAGE_FILE=""
    echo "Compression warning: failed to compress image, falling back to original file." >&2
  fi
else
  echo "Compression disabled; using original image."
fi

echo "Encoding image to Base64..."
encode_start=$(date +%s.%N)
BASE64_IMAGE=$(base64 < "$IMAGE_TO_ENCODE" | tr -d '\n')
encode_end=$(date +%s.%N)
encode_duration=$(awk "BEGIN {printf \"%.2f\", $encode_end - $encode_start}" 2>/dev/null || echo "0")
echo "Base64 encode time: ${encode_duration}s"

echo "Building JSON body..."
read -r -d '' JSON_BODY <<EOF || true
{
  "media_id": "$BASE64_IMAGE",
  "keep_distortion": false,
  "keep_ori": true
}
EOF

REQUEST_BODY_FILE=$(mktemp)
printf '%s' "$JSON_BODY" > "$REQUEST_BODY_FILE"

rm -f "$RESPONSE_FILE"

echo "Calling proxy API..."
if curl -X POST "${API_DOMAIN}${API_PATH}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json; charset=UTF-8" \
  --data-binary @"$REQUEST_BODY_FILE" \
  -o "$RESPONSE_FILE" \
  -s -w "\nHTTP status: %{http_code}\nTotal time: %{time_total}s\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\n"; then
  echo "Response saved to $RESPONSE_FILE"
else
  curl_status=$?
  rm -f "$RESPONSE_FILE"
  echo "curl failed with exit code: $curl_status" >&2
  exit "$curl_status"
fi





























