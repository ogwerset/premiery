# Version 1.0.0

**Release Date**: 2025-10-08

## Overview

First stable release of the Interactive Workflow Diagram viewer. This version includes all core features for viewing and editing workflow diagrams in a professional, corporate environment.

## What's Included

- **index.html** - Complete standalone application
- **assets/flowchart-processed.svg** - Workflow diagram with fixed color scheme

## Features

### Core Functionality
- Professional toolbar UI
- Full zoom and pan with mouse wheel support
- Interactive node clicking
- Sliding sidebar for node editing
- localStorage data persistence

### Node Editing
- Editable name field
- Rich text description
- Link attachments (with URL validation)
- File attachments list

### User Experience
- Keyboard shortcuts (+, -, 0, Esc)
- Real-time zoom percentage display
- Closeable help banner
- Smooth animations and transitions
- Professional color scheme

## Technical Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Flexbox/Grid
- **JavaScript (ES6+)** - Vanilla JS, no frameworks
- **svg-pan-zoom** - External library via CDN

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Known Limitations

- Data stored locally per browser (not synced across devices)
- SVG must be loaded via web server (fetch() requirement)
- No mobile optimization (desktop/tablet only)
- No export functionality for node data
- No collaborative editing

## Usage

### Local Development
```bash
cd versions/v1.0.0
python3 -m http.server 8000
```

### GitHub Pages
Copy contents to repository root and push to `main` branch.

## File Size

- **index.html**: ~26KB
- **flowchart-processed.svg**: ~1.5MB
- **Total**: ~1.5MB

## Performance

- Initial load: <1 second (on average connection)
- Zoom/pan: 60fps
- Node click response: <50ms
- Memory usage: ~15MB

## Changes from Development Versions

This is the first stable release. Previous iterations:
- `interactive-workflow.html` - Had SVG loading issues
- `workflow-viewer.html` - Limited interactivity

## Migration Notes

If migrating from a development version:
1. No data migration needed (fresh start)
2. Update any bookmarks to new file location
3. localStorage keys remain the same (`workflowNodeData`)

## Upgrading

To upgrade to future versions:
1. Export your node data from localStorage (optional)
2. Replace files with new version
3. Data will be preserved (same localStorage key)

## Support

For issues or questions:
- Check main [README.md](../../README.md)
- Review [CHANGELOG.md](../../CHANGELOG.md)
- Open issue on GitHub repository

---

**Version**: 1.0.0
**Status**: Stable
**Maintained**: Yes
