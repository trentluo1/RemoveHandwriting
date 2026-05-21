#!/bin/bash

# Test TextIn handwriting erase integration via local /api/process-image endpoint.

set -euo pipefail

IMAGE_FILE="${1:-testpaper.jpg}"
API_ENDPOINT="${API_ENDPOINT:-http://localhost:3000/api/process-image}"
USER_ID="${USER_ID:-test-user-textin}"

if [ ! -f "$IMAGE_FILE" ]; then
	echo "Test image not found: $IMAGE_FILE"
	exit 1
fi

if [ -z "${TEXTIN_APP_ID:-}" ] || [ -z "${TEXTIN_SECRET_CODE:-}" ]; then
	echo "Missing TEXTIN_APP_ID or TEXTIN_SECRET_CODE in environment."
	echo "Export credentials and set IMAGE_PROCESSING_PROVIDER=textin before running."
	exit 1
fi

if ! curl -s "$API_ENDPOINT" > /dev/null 2>&1; then
	echo "Web server is not running at $API_ENDPOINT"
	echo "Start it with: cd removehandwriting-web && IMAGE_PROCESSING_PROVIDER=textin npm run dev"
	exit 1
fi

echo "Testing TextIn provider via $API_ENDPOINT"
echo "Image: $IMAGE_FILE"

REGION_ARGS=()
if [ -n "${ERASE_REGION:-}" ]; then
	echo "Region erase: $ERASE_REGION"
	REGION_ARGS=(-F "eraseRegion=${ERASE_REGION}")
fi

response="$(curl -sS \
	-F "image=@${IMAGE_FILE}" \
	-F "userId=${USER_ID}" \
	"${REGION_ARGS[@]}" \
	"${API_ENDPOINT}")"

if echo "$response" | grep -q '"mediaId"'; then
	echo "Success: received processed image payload."
	exit 0
fi

echo "Request failed:"
echo "$response"
exit 1
