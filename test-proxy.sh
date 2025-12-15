#!/usr/bin/env bash

set -euo pipefail

# Domain and token for the image processing proxy
API_DOMAIN="https://fmainzedwriting-hebmkwogko.cn-hangzhou.fcapp.run"
API_PATH="/sjccup"
API_TOKEN="tokenData-31d4gj1ibb85624haafghba45e7i"

# Test image file
IMAGE_FILE="testpaper.jpg"

if [ ! -f "$IMAGE_FILE" ]; then
  echo "Image file not found: $IMAGE_FILE" >&2
  exit 1
fi

echo "Encoding image to Base64..."
# Encode image to Base64 and remove newlines
BASE64_IMAGE=$(base64 "$IMAGE_FILE" | tr -d '\n')

echo "Building JSON body..."
read -r -d '' JSON_BODY <<EOF || true
{
  "media_id": "$BASE64_IMAGE",
  "keep_distortion": false,
  "keep_ori": true
}
EOF

echo "Calling proxy API..."
curl -X POST "${API_DOMAIN}${API_PATH}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json; charset=UTF-8" \
  -d "$JSON_BODY" \
  -o response.json \
  -s -w "\nHTTP status: %{http_code}\n"

echo "Response saved to response.json"





















