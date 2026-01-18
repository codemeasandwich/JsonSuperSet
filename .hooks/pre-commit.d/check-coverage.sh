#!/usr/bin/env bash
#
# Test coverage check for JsonSuperSet
#
# Enforces 100% coverage on all metrics:
#   - Statements
#   - Branches
#   - Functions
#   - Lines
#
# Exit codes:
#   0 - Coverage meets 100% threshold
#   1 - Coverage below 100%

set -e

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ "$SCRIPT_DIR" == *".git/hooks"* ]]; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi
cd "$PROJECT_ROOT"

echo "    Checking test coverage (100% required on all metrics)..."
echo ""

# Run Jest with coverage thresholds
# Using --coverageThreshold to fail if coverage is below 100%
npm test -- --coverage \
    --coverageThreshold='{"global":{"branches":100,"functions":100,"lines":100,"statements":100}}' \
    --coverageReporters=text-summary \
    2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "    Coverage: 100% on all metrics"
    exit 0
else
    echo ""
    echo "    Coverage below 100% - add tests to cover missing lines/branches"
    exit 1
fi
