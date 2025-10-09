# Changelog

All notable changes to the Interactive Workflow Diagram project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-10-09

### Added
- **Dark Mode**: Full dark mode support with automatic system preference detection
  - Toggle button in toolbar with moon/sun icon
  - Respects system `prefers-color-scheme` setting on first visit
  - User preference saved to localStorage and persists across sessions
  - Smooth transitions between light and dark themes
  - All UI elements adapted with proper contrast

- **Enhanced Node Visual Feedback**:
  - Much more prominent hover glow effect with `drop-shadow` filter
  - Subtle scale animation on hover (1.02x)
  - Brighter and more visible hover states in both light and dark modes

- **Selected Node Outline**:
  - Active/selected nodes now display a thick blue outline with glow
  - Selection persists while sidebar is open
  - Automatically removed when closing sidebar or selecting different node

- **Data Export/Import System**:
  - **Export (Dev Mode)**: Download all node data as formatted JSON file (`workflow-data.json`)
  - **Import (View Mode)**: Upload JSON file to load node data
  - Visual feedback on successful export/import
  - Data validation on import with error handling
  - Perfect for version control and sharing node data across team

- **Interactive Minimap**:
  - Bottom-left minimap showing entire diagram overview
  - Real-time viewport indicator showing current view area
  - Click minimap to jump to specific areas
  - Drag viewport rectangle to pan
  - Toggle button to show/hide minimap
  - State persists in localStorage

- **Complete Polish Translation**:
  - All UI elements translated to Polish
  - Buttons, labels, placeholders, and messages
  - Error messages and success notifications
  - Help banner and tooltips

### Changed
- Updated version to 1.3.0
- Node hover effects significantly more prominent and visible
- CSS variables implemented for theming consistency
- All hardcoded colors replaced with CSS custom properties
- Export button visible only in Dev Mode
- Import button visible only in View Mode
- Improved color contrast in dark mode for better accessibility

### Technical Details
- Implemented CSS custom properties (CSS variables) for theming
- Added `body.dark-mode` class for theme switching
- Enhanced node interactivity with `filter: drop-shadow()` and `transform: scale()`
- Added `.node-selected` class for selected node styling
- Minimap uses cloned SVG with synchronized viewport tracking
- Export/Import uses `Blob` API and `FileReader` for file operations
- System theme detection using `window.matchMedia('prefers-color-scheme: dark')`

## [1.2.0] - 2025-10-08

### Added
- **Dev/View Mode Toggle**: New mode switcher in toolbar to toggle between editing and viewing modes
  - **Dev Mode**: Full editing capabilities with editable fields, "Save Changes" button, and add/delete controls
  - **View Mode**: Read-only display with disabled inputs, hidden edit controls, perfect for end-user viewing
- **Mode Persistence**: Selected mode is saved to localStorage and persists across sessions
- **Dynamic Banner Text**: Info banner updates based on mode ("view/edit" vs "view" details)
- **Proper Node Highlighting**: Fixed CSS to only highlight interactive nodes, not entire diagram

### Changed
- Updated CSS selectors from `g[data-cell-id]` to `.node-interactive` class for better targeting
- Modified hover effects to apply only to clickable nodes with actual content
- Improved sidebar behavior to respect current mode when opening nodes

### Fixed
- **Grey Bar Issue**: Changed sidebar from `position: relative` to `position: fixed` - eliminates grey space when sidebar is hidden
- **Node ID Detection**: Fixed JavaScript to use `data-cell-id` attribute instead of `id` attribute, enabling unique node identification
- Resolved issue where all nodes showed the same ID
- Fixed visual highlighting applying to wrong elements

### Technical Details
- Added `node-interactive` class application in `makeNodesClickable()`
- Implemented `toggleMode()`, `updateModeUI()`, and `initMode()` functions
- Added view-mode specific CSS styles for disabled inputs and hidden controls
- Sidebar now uses fixed positioning with right-edge animation

## [1.1.0] - 2025-10-08

### Fixed
- **Sidebar Layout Issue**: Fixed grey bar appearing on right side when sidebar is hidden
  - Changed sidebar positioning from `relative` with `transform` to `fixed` with `right` animation
  - Sidebar no longer takes up space in layout when hidden
- **Node ID Detection**: Fixed all nodes showing the same ID
  - Updated selectors to use `data-cell-id` attribute which SVG actually uses
  - Each node now correctly displays its unique identifier

### Changed
- Sidebar CSS: Changed from `position: relative; transform: translateX(100%)` to `position: fixed; right: -400px`
- Sidebar animation: Now animates `right` property instead of `transform`
- Added `z-index: 200` to sidebar for proper layering

### Technical Details
- Updated CSS selectors in `makeNodesClickable()` from `g[id]` to `g[data-cell-id]`
- Updated hover styles from `g[id]` to `g[data-cell-id]`

## [1.0.0] - 2025-10-08

### Added
- **Professional Corporate UI**: Clean, modern interface with top toolbar
- **Full Zoom & Pan**: Mouse wheel zoom and drag-to-pan functionality using svg-pan-zoom library
- **Interactive Nodes**: Click any node to view and edit its details
- **Sliding Sidebar Panel**: Professional slide-in/slide-out animation for node details
- **Node Data Editor**:
  - Editable node name
  - Rich text description field
  - Attached links with clickable URLs
  - Attached files list
- **Data Persistence**: All changes auto-save to browser's localStorage
- **Closeable Help Banner**: Quick guide with dismiss functionality (remembers preference)
- **Keyboard Shortcuts**:
  - `+` or `=` - Zoom in
  - `-` - Zoom out
  - `0` - Reset zoom
  - `Esc` - Close sidebar
- **Real-time Zoom Display**: Shows current zoom percentage in toolbar
- **Responsive Controls**: Zoom buttons, reset button, and panel toggle in toolbar
- **Professional Animations**: Smooth transitions and hover effects
- **Version Display**: Version number shown in toolbar

### Features
- SVG-based workflow diagram with preserved colors, emojis, and styling
- External library integration (svg-pan-zoom from CDN)
- No build process required - pure HTML/CSS/JavaScript
- GitHub Pages compatible
- Works with local web server (Python's http.server)
- Cross-browser compatible (Chrome, Firefox, Safari, Edge)

### Technical Details
- Uses `fetch()` API to load SVG dynamically
- localStorage API for data persistence
- Event delegation for node click handling
- Modular JavaScript structure
- CSS Grid and Flexbox layouts
- CSS transitions for smooth animations

### Files
- `index.html` - Main application file
- `assets/flowchart-processed.svg` - Workflow diagram SVG
- `versions/v1.0.0/` - Archived version 1.0.0

---

## Version Naming Convention

- **Major version (X.0.0)**: Breaking changes, major UI overhaul, incompatible changes
- **Minor version (1.X.0)**: New features, significant improvements, backward compatible
- **Patch version (1.0.X)**: Bug fixes, minor improvements, small tweaks

## Future Versions Template

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future versions

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements or fixes
```
