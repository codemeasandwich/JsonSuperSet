#!/usr/bin/env bash
#
# JSDoc validation check for JsonSuperSet
#
# Runs the Node.js JSDoc validator to ensure all JavaScript files have:
# - @fileoverview comment at the top
# - JSDoc comments for all functions with description, @param, @returns
#
# Exit codes:
#   0 - All files have valid JSDoc
#   1 - One or more files have JSDoc errors

set -e

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ "$SCRIPT_DIR" == *".git/hooks"* ]]; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi
cd "$PROJECT_ROOT"

# Run the JSDoc validator
node "$SCRIPT_DIR/jsdoc-validator.js"
