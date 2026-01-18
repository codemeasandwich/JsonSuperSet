#!/usr/bin/env bash
#
# TypeScript definitions check for JsonSuperSet
#
# Validates that index.d.ts exports match index.js exports.
# This ensures the TypeScript definitions stay in sync with the
# JavaScript implementation.
#
# Exit codes:
#   0 - TypeScript definitions are in sync
#   1 - Definitions are out of sync

set -e

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ "$SCRIPT_DIR" == *".git/hooks"* ]]; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi
cd "$PROJECT_ROOT"

echo "    Checking TypeScript definitions (index.d.ts)..."

# Run the TypeScript validator
node "$SCRIPT_DIR/check-typescript.js"
