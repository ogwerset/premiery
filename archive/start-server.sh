#!/bin/bash

echo "Starting local web server..."
echo "Open your browser to: http://localhost:8000/workflow-viewer.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8000
