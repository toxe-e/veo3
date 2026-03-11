#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  echo "Missing .env file. Copy .env.example first." >&2
  exit 1
fi

export $(grep -v '^#' .env | xargs)

if [[ -z "${KIE_API_KEY:-}" || -z "${CALLBACK_URL:-}" ]]; then
  echo "Set KIE_API_KEY and CALLBACK_URL in .env before running." >&2
  exit 1
fi

curl --fail --silent --show-error \
  --request POST "https://api.kie.ai/api/v1/veo/generate" \
  --header "Authorization: Bearer ${KIE_API_KEY}" \
  --header "Content-Type: application/json" \
  --data @<(cat <<JSON
{
  "model": "veo3_fast",
  "prompt": "Ultra wide shot of an electric skateboarder drifting through neon-lit streets in the rain, cinematic lighting, volumetric fog",
  "aspect_ratio": "16:9",
  "callBackUrl": "${CALLBACK_URL}",
  "generationType": "TEXT_2_VIDEO"
}
JSON
)
