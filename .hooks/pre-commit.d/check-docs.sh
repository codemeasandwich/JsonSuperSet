#!/usr/bin/env bash
#
# Documentation check for JsonSuperSet
#
# Ensures every directory contains:
#   - README.md - Overview and usage documentation
#   - files.md  - Description of files in the directory
#
# Excluded directories:
#   - node_modules
#   - .git
#   - .hooks
#   - coverage
#   - .claude
#
# Exit codes:
#   0 - All directories have required documentation
#   1 - One or more directories missing documentation

set -e

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ "$SCRIPT_DIR" == *".git/hooks"* ]]; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi
cd "$PROJECT_ROOT"

echo "    Checking documentation (README.md & files.md in every folder)..."

# Directories to exclude from checking
EXCLUDED_DIRS="node_modules|\.git|\.hooks|coverage|\.claude"

# Track missing files
MISSING_README=()
MISSING_FILES=()

# Find all directories (excluding hidden and excluded)
while IFS= read -r dir; do
    # Skip if directory matches exclusion pattern
    if echo "$dir" | grep -Eq "(^|/)($EXCLUDED_DIRS)(/|$)"; then
        continue
    fi

    # Check for README.md
    if [ ! -f "$dir/README.md" ]; then
        MISSING_README+=("$dir")
    fi

    # Check for files.md
    if [ ! -f "$dir/files.md" ]; then
        MISSING_FILES+=("$dir")
    fi
done < <(find . -type d -not -path '*/\.*' 2>/dev/null | sed 's|^\./||' | sort)

# Also check root directory
if [ ! -f "README.md" ]; then
    MISSING_README+=(".")
fi
if [ ! -f "files.md" ]; then
    MISSING_FILES+=(".")
fi

# Report results
HAS_ERROR=0

if [ ${#MISSING_README[@]} -gt 0 ]; then
    echo ""
    echo "    Missing README.md in:"
    for dir in "${MISSING_README[@]}"; do
        echo "      - $dir"
    done
    HAS_ERROR=1
fi

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo ""
    echo "    Missing files.md in:"
    for dir in "${MISSING_FILES[@]}"; do
        echo "      - $dir"
    done
    HAS_ERROR=1
fi

if [ $HAS_ERROR -eq 1 ]; then
    echo ""
    echo "    Each directory must contain:"
    echo "      - README.md: Overview and usage documentation"
    echo "      - files.md: Description of files in the directory"
    exit 1
fi

echo "    All directories have required documentation"
exit 0
