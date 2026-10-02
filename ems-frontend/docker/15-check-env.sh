#!/bin/sh
set -eu

# Runs before the official Nginx entrypoint substitutes the template.
if ! printf '%s\n' "${BACKEND_API_URL:-}" | grep -Eq '^https?://[a-zA-Z0-9.-]+(:[0-9]+)?(/[a-zA-Z0-9._~/-]*)?$'; then
  echo >&2 'Set BACKEND_API_URL to a full http(s) API URL, including /api, without a trailing slash.'
  exit 1
fi

case "$BACKEND_API_URL" in
  */)
    echo >&2 'BACKEND_API_URL must not end with a slash.'
    exit 1
    ;;
esac

if ! printf '%s\n' "${PORT:-}" | grep -Eq '^[0-9]+$' || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
  echo >&2 'PORT must be a number between 1 and 65535.'
  exit 1
fi
