#!/usr/bin/env bash
#
# Yoda conditions check for JsonSuperSet
#
# Validates that all JavaScript comparisons use Yoda conditions
# (literal on the left side of comparison operators).
#
# Example:
#   WRONG:   if (x === "foo")
#   CORRECT: if ("foo" === x)
#
# Exit codes:
#   0 - All comparisons are Yoda-compliant
#   1 - One or more violations found

set -e

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ "$SCRIPT_DIR" == *".git/hooks"* ]]; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi
cd "$PROJECT_ROOT"

# Run the Yoda validator
node "$SCRIPT_DIR/yoda-validator.js"
