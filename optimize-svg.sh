#!/bin/bash
# SVG Optimization Script
# Optimizes the SVG diagram file to reduce file size

set -e

echo "🎨 SVG Optimization Script"
echo ""

# Check if SVGO is installed
if ! command -v svgo &> /dev/null; then
    echo "❌ SVGO is not installed"
    echo ""
    echo "To install SVGO:"
    echo "  npm install -g svgo"
    echo ""
    echo "Or use npx without installing:"
    echo "  npx svgo assets/flowchart-processed.svg -o assets/flowchart-optimized.svg"
    exit 1
fi

SVG_FILE="assets/flowchart-processed.svg"

if [ ! -f "$SVG_FILE" ]; then
    echo "❌ SVG file not found: $SVG_FILE"
    exit 1
fi

# Get original size
ORIGINAL_SIZE=$(ls -lh "$SVG_FILE" | awk '{print $5}')
echo "📊 Original SVG size: $ORIGINAL_SIZE"

# Create backup
echo "💾 Creating backup..."
cp "$SVG_FILE" "$SVG_FILE.backup"

# Optimize
echo "⚡ Optimizing SVG..."
svgo "$SVG_FILE" \
    --multipass \
    --pretty \
    --indent=2 \
    --config='{
        "plugins": [
            {
                "name": "preset-default",
                "params": {
                    "overrides": {
                        "removeViewBox": false,
                        "cleanupIDs": false
                    }
                }
            },
            "removeDoctype",
            "removeComments",
            "removeMetadata",
            "removeEditorsNSData",
            "removeEmptyAttrs",
            "removeHiddenElems",
            "removeEmptyText",
            "removeEmptyContainers",
            "minifyStyles",
            "removeUnusedNS",
            "sortAttrs"
        ]
    }'

# Get new size
NEW_SIZE=$(ls -lh "$SVG_FILE" | awk '{print $5}')
echo ""
echo "✅ Optimization complete!"
echo "📊 Original size: $ORIGINAL_SIZE"
echo "📊 New size: $NEW_SIZE"
echo ""
echo "💾 Backup saved as: $SVG_FILE.backup"
echo ""
