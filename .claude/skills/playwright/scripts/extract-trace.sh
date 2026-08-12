#!/usr/bin/env bash
# Extract a Playwright trace.zip and print a structured summary.
# Usage: ./scripts/explore-trace.sh <trace.zip> [out_dir]
#
# Output layout (under out_dir):
#   trace.trace    - newline-delimited JSON of actions/events
#   trace.network  - newline-delimited JSON of network requests
#   trace.stacks   - stack traces (binary, optional)
#   resources/     - screenshots (.jpeg), DOM snapshots (.html)
#
# Summary printed to stdout:
#   - action count + per-API breakdown
#   - error/console messages
#   - screenshot count + first/last paths
#   - network request count

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <trace.zip> [out_dir]" >&2
  exit 2
fi

ZIP="$1"
OUT="${2:-${TMPDIR:-/tmp}/pw-trace-$(basename "$ZIP" .zip)-$$}"

if [ ! -f "$ZIP" ]; then
  echo "error: $ZIP not found" >&2
  exit 1
fi

mkdir -p "$OUT"
unzip -q -o "$ZIP" -d "$OUT"

echo "==> extracted to: $OUT"
echo

# Playwright sometimes splits into trace.trace + 0-trace.trace (multi-context).
TRACE_FILES=$(find "$OUT" -maxdepth 2 -name '*.trace' -not -name '*.stacks' | sort)
NET_FILES=$(find "$OUT" -maxdepth 2 -name '*.network' | sort)

if [ -z "$TRACE_FILES" ]; then
  echo "warning: no .trace files found" >&2
fi

echo "==> trace files:"
echo "$TRACE_FILES" | sed 's/^/  /'
echo

echo "==> action breakdown (top 30):"
# shellcheck disable=SC2086
cat $TRACE_FILES 2>/dev/null \
  | jq -r 'select(.type == "before" or .type == "action") | .apiName // .method // .type' \
  | sort | uniq -c | sort -rn | head -30
echo

echo "==> errors / console:"
# shellcheck disable=SC2086
cat $TRACE_FILES 2>/dev/null \
  | jq -c 'select(.type == "error" or .type == "console" or .error != null) | {type, text: (.text // .error.message // .error), location: .location}' \
  | head -50
echo

SHOTS=$(find "$OUT/resources" -name '*.jpeg' 2>/dev/null | sort)
SHOT_COUNT=$(echo "$SHOTS" | grep -c . || true)
echo "==> screenshots: $SHOT_COUNT"
if [ "$SHOT_COUNT" -gt 0 ]; then
  echo "  first: $(echo "$SHOTS" | head -1)"
  echo "  last:  $(echo "$SHOTS" | tail -1)"
fi
echo

if [ -n "$NET_FILES" ]; then
  # shellcheck disable=SC2086
  REQ_COUNT=$(cat $NET_FILES | jq -c 'select(.method != null)' | wc -l | tr -d ' ')
  echo "==> network requests: $REQ_COUNT"
  # shellcheck disable=SC2086
  cat $NET_FILES | jq -r 'select(.method != null) | "\(.method) \(.url // .responseUrl // "?")"' | head -10 | sed 's/^/  /'
fi
echo

echo "Done. Inspect further:"
echo "  jq -c '.' $OUT/*.trace | less"
echo "  open $OUT/resources/  # screenshots"
