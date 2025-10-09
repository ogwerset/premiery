#!/bin/bash
# Build Read-Only Production Version
# This script creates a production-ready, read-only version of the workflow diagram
# with all data baked in and dev features removed.

set -e

echo "🚀 Building Read-Only Production Version..."
echo ""

# Create production directory
PROD_DIR="production"
rm -rf "$PROD_DIR"
mkdir -p "$PROD_DIR/assets"

echo "📁 Creating production directory structure..."

# Copy base files
cp index.html "$PROD_DIR/"
cp styles.css "$PROD_DIR/"
cp assets/flowchart-processed.svg "$PROD_DIR/assets/"

# Export current localStorage data to JSON
echo "💾 Exporting current data from localStorage..."
echo "⚠️  IMPORTANT: Open the app in your browser and export your data first!"
echo "   Then save it as 'workflow-data.json' in the project root."
echo ""

if [ ! -f "workflow-data.json" ]; then
    echo "❌ Error: workflow-data.json not found!"
    echo "   Please:"
    echo "   1. Open the app in your browser"
    echo "   2. Click 'Eksportuj' to download your data"
    echo "   3. Save it as 'workflow-data.json' in the project root"
    echo "   4. Run this script again"
    exit 1
fi

echo "✅ Found workflow-data.json"

# Create read-only app.js with data baked in
echo "🔧 Creating read-only JavaScript..."
cat > "$PROD_DIR/app.js" << 'EOJS'
/**
 * Interactive Workflow Diagram - Read-Only Production Build
 * Version: 1.5.0-readonly
 */

// Baked-in data (will be injected during build)
const PRODUCTION_DATA = __PRODUCTION_DATA__;

// ================================================
// Constants
// ================================================
const CONSTANTS = {
    SIDEBAR_WIDTH: 400,
    TOOLBAR_HEIGHT: 56,
    MINIMAP_WIDTH: 220,
    MINIMAP_HEIGHT: 160,
    ZOOM_DEBOUNCE_MS: 16,
    MINIMAP_THROTTLE_MS: 100,
    SVG_INIT_DELAY: 100
};

// ================================================
// State Management (Read-Only)
// ================================================
const state = {
    panZoomInstance: null,
    currentNodeId: null,
    nodeData: PRODUCTION_DATA,
    selectedElement: null,
    minimapInitialized: false,
    lastMinimapUpdate: 0
};

// ================================================
// DOM Element Cache
// ================================================
const elements = {};

function cacheDOMElements() {
    elements.svgWrapper = document.getElementById('svg-wrapper');
    elements.sidebar = document.getElementById('sidebar');
    elements.sidebarContent = document.getElementById('sidebar-content');
    elements.toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    elements.nodeTitle = document.getElementById('node-title');
    elements.nodeId = document.getElementById('node-id');
    elements.nodeName = document.getElementById('node-name');
    elements.nodeDescription = document.getElementById('node-description');
    elements.linksList = document.getElementById('links-list');
    elements.filesList = document.getElementById('files-list');
    elements.zoomLevel = document.getElementById('zoom-level');
    elements.darkModeIcon = document.getElementById('dark-mode-icon');
    elements.minimap = document.getElementById('minimap');
    elements.minimapContainer = document.getElementById('minimap-container');
    elements.minimapViewport = document.getElementById('minimap-viewport');
    elements.minimapToggle = document.getElementById('minimap-toggle');
}

EOJS

# Inject the actual data
echo "📝 Injecting production data..."
DATA=$(cat workflow-data.json)
sed -i.bak "s|__PRODUCTION_DATA__|$DATA|g" "$PROD_DIR/app.js"
rm "$PROD_DIR/app.js.bak"

# Append the rest of app.js (utility functions, etc)
cat >> "$PROD_DIR/app.js" << 'EOJS'

// ================================================
// Utility Functions
// ================================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ================================================
// SVG Loading & Initialization
// ================================================
async function loadSVG() {
    try {
        const response = await fetch('assets/flowchart-processed.svg');
        const svgText = await response.text();
        elements.svgWrapper.innerHTML = svgText;

        setTimeout(() => {
            const svgElement = document.querySelector('#svg-wrapper svg');
            if (svgElement) {
                initializePanZoom(svgElement);
                makeNodesClickable();
                const isDarkMode = document.body.classList.contains('dark-mode');
                updateSvgBackground(isDarkMode);
                setTimeout(() => {
                    initMinimap();
                }, 200);
            }
        }, CONSTANTS.SVG_INIT_DELAY);
    } catch (error) {
        console.error('Error loading SVG:', error);
    }
}

function initializePanZoom(svgElement) {
    state.panZoomInstance = svgPanZoom(svgElement, {
        zoomEnabled: true,
        controlIconsEnabled: false,
        fit: true,
        center: true,
        minZoom: 0.1,
        maxZoom: 5,
        zoomScaleSensitivity: 0.3,
        mouseWheelZoomEnabled: true,
        dblClickZoomEnabled: false,
        preventMouseEventsDefault: true
    });

    const debouncedZoomUpdate = debounce((level) => {
        elements.zoomLevel.textContent = Math.round(level * 100) + '%';
    }, CONSTANTS.ZOOM_DEBOUNCE_MS);

    const throttledMinimapUpdate = throttle(() => {
        updateMinimapViewport();
    }, CONSTANTS.MINIMAP_THROTTLE_MS);

    state.panZoomInstance.setOnZoom(function(level) {
        debouncedZoomUpdate(level);
        throttledMinimapUpdate();
    });

    state.panZoomInstance.setOnPan(function() {
        throttledMinimapUpdate();
    });

    enablePinchZoom(svgElement);
}

function enablePinchZoom(svgElement) {
    let initialDistance = 0;
    let initialZoom = 1;

    svgElement.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            initialDistance = getDistance(e.touches[0], e.touches[1]);
            initialZoom = state.panZoomInstance.getZoom();
        }
    }, { passive: false });

    svgElement.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && state.panZoomInstance) {
            e.preventDefault();
            const currentDistance = getDistance(e.touches[0], e.touches[1]);
            const scale = currentDistance / initialDistance;
            const newZoom = initialZoom * scale;
            const constrainedZoom = Math.max(0.1, Math.min(5, newZoom));
            state.panZoomInstance.zoom(constrainedZoom);
        }
    }, { passive: false });

    function getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

function makeNodesClickable() {
    const svgElement = document.querySelector('#svg-wrapper svg');
    if (!svgElement) return;

    const nodes = svgElement.querySelectorAll('g[data-cell-id]');

    nodes.forEach((node) => {
        const nodeId = node.getAttribute('data-cell-id');
        if (nodeId === '0' || nodeId === '1') return;

        const hasContent = node.querySelector('rect, ellipse, path, text, image');
        if (!hasContent) return;

        node.classList.add('node-interactive');
        node.setAttribute('role', 'button');
        node.setAttribute('tabindex', '0');
        node.setAttribute('aria-label', `Workflow node ${nodeId}`);

        node.addEventListener('click', (e) => {
            e.stopPropagation();
            openNodeViewer(nodeId, node);
        });

        node.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                openNodeViewer(nodeId, node);
            }
        });

        node.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            node.style.opacity = '0.75';
        }, { passive: true });

        node.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setTimeout(() => {
                node.style.opacity = '';
                openNodeViewer(nodeId, node);
            }, 100);
        });

        node.addEventListener('touchcancel', () => {
            node.style.opacity = '';
        }, { passive: true });
    });
}

// ================================================
// Node Viewer (Read-Only)
// ================================================
function openNodeViewer(nodeId, element) {
    if (state.selectedElement) {
        state.selectedElement.classList.remove('node-selected');
        state.selectedElement.removeAttribute('aria-selected');
    }

    state.currentNodeId = nodeId;
    state.selectedElement = element;

    if (state.selectedElement) {
        state.selectedElement.classList.add('node-selected');
        state.selectedElement.setAttribute('aria-selected', 'true');
    }

    const textElement = element.querySelector('text');
    const nodeText = textElement ? textElement.textContent.trim() : 'Unnamed Node';

    const nodeData = state.nodeData[nodeId] || {
        name: nodeText,
        description: '',
        links: [],
        files: []
    };

    elements.nodeTitle.textContent = nodeText;
    elements.nodeId.textContent = `Node ID: ${nodeId}`;
    elements.nodeName.value = nodeData.name;
    elements.nodeDescription.value = nodeData.description;

    renderLinks(nodeData.links);
    renderFiles(nodeData.files);

    elements.sidebar.classList.add('open');
    elements.sidebar.setAttribute('aria-hidden', 'false');
    elements.toggleSidebarBtn.setAttribute('aria-expanded', 'true');
}

function renderLinks(links) {
    if (!links || links.length === 0) {
        elements.linksList.innerHTML = '<li class="empty-state">No links attached</li>';
        return;
    }

    elements.linksList.innerHTML = links.map(link => `
        <li class="link-item">
            <a href="${link}" target="_blank" rel="noopener">${link}</a>
        </li>
    `).join('');
}

function renderFiles(files) {
    if (!files || files.length === 0) {
        elements.filesList.innerHTML = '<li class="empty-state">No files attached</li>';
        return;
    }

    elements.filesList.innerHTML = files.map(file => `
        <li class="file-item">
            <span>${file}</span>
        </li>
    `).join('');
}

function toggleSidebar() {
    if (elements.sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        elements.sidebar.classList.add('open');
        elements.sidebar.setAttribute('aria-hidden', 'false');
        elements.toggleSidebarBtn.setAttribute('aria-expanded', 'true');
    }
}

function closeSidebar() {
    if (state.selectedElement) {
        state.selectedElement.classList.remove('node-selected');
        state.selectedElement.removeAttribute('aria-selected');
    }

    elements.sidebar.classList.remove('open');
    elements.sidebar.setAttribute('aria-hidden', 'true');
    elements.toggleSidebarBtn.setAttribute('aria-expanded', 'false');
    state.currentNodeId = null;
    state.selectedElement = null;
}

// ================================================
// Dark Mode
// ================================================
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    updateDarkModeIcon(isDarkMode);
    updateSvgBackground(isDarkMode);

    const darkModeBtn = document.getElementById('dark-mode-toggle');
    if (darkModeBtn) {
        darkModeBtn.setAttribute('aria-pressed', isDarkMode.toString());
    }
}

function updateDarkModeIcon(isDarkMode) {
    if (isDarkMode) {
        elements.darkModeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>';
    } else {
        elements.darkModeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>';
    }
}

function updateSvgBackground(isDarkMode) {
    const svgElement = document.querySelector('#svg-wrapper svg');
    if (svgElement) {
        svgElement.style.background = isDarkMode ? 'var(--bg-secondary)' : 'white';
    }

    const minimapSvg = elements.minimapContainer?.querySelector('svg');
    if (minimapSvg) {
        minimapSvg.style.background = isDarkMode ? 'var(--bg-tertiary)' : 'white';
    }
}

function initDarkMode() {
    const savedDarkMode = localStorage.getItem('darkMode');

    if (savedDarkMode !== null) {
        if (savedDarkMode === 'true') {
            document.body.classList.add('dark-mode');
            updateDarkModeIcon(true);
            updateSvgBackground(true);
        }
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
            updateDarkModeIcon(true);
            updateSvgBackground(true);
        }
    }

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (localStorage.getItem('darkMode') === null) {
                if (e.matches) {
                    document.body.classList.add('dark-mode');
                    updateDarkModeIcon(true);
                    updateSvgBackground(true);
                } else {
                    document.body.classList.remove('dark-mode');
                    updateDarkModeIcon(false);
                    updateSvgBackground(false);
                }
            }
        });
    }
}

// ================================================
// Minimap
// ================================================
function initMinimap() {
    if (state.minimapInitialized) return;

    const svgWrapper = elements.svgWrapper;
    const svgElement = svgWrapper.querySelector('svg');
    if (!svgElement) return;

    const svgClone = svgElement.cloneNode(true);

    svgClone.querySelectorAll('.node-interactive').forEach(node => {
        node.classList.remove('node-interactive');
        node.style.cursor = 'default';
        node.style.pointerEvents = 'none';
    });

    const existingSvg = elements.minimapContainer.querySelector('svg');
    if (existingSvg) existingSvg.remove();

    svgClone.style.width = '100%';
    svgClone.style.height = '100%';
    svgClone.style.display = 'block';

    const isDarkMode = document.body.classList.contains('dark-mode');
    svgClone.style.background = isDarkMode ? 'var(--bg-tertiary)' : 'white';

    elements.minimapContainer.insertBefore(svgClone, elements.minimapViewport);
    updateMinimapViewport();
    makeViewportDraggable();

    const minimapHidden = localStorage.getItem('minimapHidden');
    if (minimapHidden === 'true') {
        elements.minimap.classList.add('hidden');
        elements.minimapToggle.classList.remove('with-minimap');
    } else {
        elements.minimap.classList.remove('hidden');
        elements.minimapToggle.classList.add('with-minimap');
    }

    state.minimapInitialized = true;
}

function updateMinimapViewport() {
    if (!state.panZoomInstance || !state.minimapInitialized) return;

    const viewport = elements.minimapViewport;
    const minimap = elements.minimap;
    const minimapContainer = elements.minimapContainer;
    const svgElement = document.querySelector('#svg-wrapper svg');

    if (!viewport || !svgElement) return;
    if (minimap.classList.contains('hidden')) return;

    try {
        const pan = state.panZoomInstance.getPan();
        const zoom = state.panZoomInstance.getZoom();
        const sizes = state.panZoomInstance.getSizes();

        const minimapRect = minimapContainer.getBoundingClientRect();

        const scaleX = minimapRect.width / sizes.width;
        const scaleY = minimapRect.height / sizes.height;

        const viewportWidth = (sizes.viewBox.width / zoom) * scaleX;
        const viewportHeight = (sizes.viewBox.height / zoom) * scaleY;
        const viewportX = (-pan.x / zoom) * scaleX;
        const viewportY = (-pan.y / zoom) * scaleY;

        viewport.style.width = viewportWidth + 'px';
        viewport.style.height = viewportHeight + 'px';
        viewport.style.left = viewportX + 'px';
        viewport.style.top = viewportY + 'px';
        viewport.style.display = 'block';
    } catch (error) {
        console.error('Error updating minimap viewport:', error);
    }
}

function makeViewportDraggable() {
    const viewport = elements.minimapViewport;
    const minimapContainer = elements.minimapContainer;
    let isDragging = false;

    function moveViewport(clientX, clientY) {
        if (!state.panZoomInstance) return;

        const rect = minimapContainer.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;

        const sizes = state.panZoomInstance.getSizes();
        const zoom = state.panZoomInstance.getZoom();

        const panX = -x * sizes.width * zoom + (sizes.viewBox.width / 2);
        const panY = -y * sizes.height * zoom + (sizes.viewBox.height / 2);

        state.panZoomInstance.pan({ x: panX, y: panY });
    }

    viewport.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.preventDefault();
    });

    minimapContainer.addEventListener('click', (e) => {
        if (e.target === viewport) return;
        moveViewport(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) moveViewport(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    viewport.addEventListener('touchstart', (e) => {
        isDragging = true;
        e.preventDefault();
    }, { passive: false });

    minimapContainer.addEventListener('touchstart', (e) => {
        if (e.target === viewport) return;
        const touch = e.touches[0];
        moveViewport(touch.clientX, touch.clientY);
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length > 0) {
            const touch = e.touches[0];
            moveViewport(touch.clientX, touch.clientY);
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchend', () => {
        isDragging = false;
    }, { passive: true });

    document.addEventListener('touchcancel', () => {
        isDragging = false;
    }, { passive: true });
}

function toggleMinimap() {
    if (!state.minimapInitialized) {
        initMinimap();
    }

    const isHidden = elements.minimap.classList.toggle('hidden');
    localStorage.setItem('minimapHidden', isHidden);

    elements.minimapToggle.setAttribute('aria-expanded', (!isHidden).toString());

    if (isHidden) {
        elements.minimapToggle.classList.remove('with-minimap');
    } else {
        elements.minimapToggle.classList.add('with-minimap');
        updateMinimapViewport();
    }
}

// ================================================
// Zoom Controls
// ================================================
function zoomIn() {
    if (state.panZoomInstance) {
        state.panZoomInstance.zoomIn();
    }
}

function zoomOut() {
    if (state.panZoomInstance) {
        state.panZoomInstance.zoomOut();
    }
}

function resetZoom() {
    if (state.panZoomInstance) {
        state.panZoomInstance.reset();
        state.panZoomInstance.fit();
        state.panZoomInstance.center();
    }
}

// ================================================
// Mobile Menu
// ================================================
function toggleMobileMenu() {
    const toolbarControls = document.querySelector('.toolbar-controls');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');

    if (toolbarControls) {
        const isOpen = toolbarControls.classList.toggle('open');

        if (mobileMenuToggle) {
            mobileMenuToggle.setAttribute('aria-expanded', isOpen.toString());
        }
    }
}

function closeMobileMenu() {
    const toolbarControls = document.querySelector('.toolbar-controls');
    if (toolbarControls && window.innerWidth <= 767) {
        toolbarControls.classList.remove('open');
    }
}

// ================================================
// Event Listeners Setup
// ================================================
function setupEventListeners() {
    document.getElementById('toggle-sidebar-btn').addEventListener('click', toggleSidebar);

    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSidebar();
        });
    }

    document.querySelectorAll('.zoom-btn')[0].addEventListener('click', zoomOut);
    document.querySelectorAll('.zoom-btn')[1].addEventListener('click', zoomIn);
    document.querySelector('.zoom-controls .btn-secondary').addEventListener('click', resetZoom);

    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

    document.getElementById('minimap-toggle').addEventListener('click', toggleMinimap);
    document.querySelector('.minimap-close').addEventListener('click', toggleMinimap);

    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    const toolbarControls = document.querySelector('.toolbar-controls');
    if (toolbarControls) {
        toolbarControls.addEventListener('click', (e) => {
            if (e.target.closest('.btn')) {
                setTimeout(closeMobileMenu, 100);
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSidebar();
        }
        if ((e.key === '+' || e.key === '=') && !e.target.matches('input, textarea')) {
            e.preventDefault();
            zoomIn();
        }
        if (e.key === '-' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            zoomOut();
        }
        if (e.key === '0' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            resetZoom();
        }
    });
}

// ================================================
// Initialization
// ================================================
function initializeApp() {
    cacheDOMElements();
    initDarkMode();
    setupEventListeners();
    loadSVG();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
EOJS

# Create production HTML (read-only version)
echo "🎨 Creating production HTML..."
cat > "$PROD_DIR/index.html" << 'EOHTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Workflow Diagram</title>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js" defer></script>
    <script src="app.js" defer></script>
</head>
<body>
    <div id="main-container">
        <div id="svg-container" role="main" aria-label="Interactive workflow diagram viewer">
            <div class="toolbar" role="banner">
                <div class="toolbar-left">
                    <div class="toolbar-title">Workflow Diagram</div>
                    <span style="font-size: 12px; color: var(--text-tertiary); margin-left: 8px;">v1.5.0</span>
                </div>
                <div class="toolbar-right">
                    <button class="btn btn-secondary btn-small mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Toggle mobile menu" aria-expanded="false">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>

                    <div class="toolbar-controls" role="toolbar" aria-label="Diagram controls">
                        <div class="zoom-controls" role="group" aria-label="Zoom controls">
                            <button class="zoom-btn" title="Zoom out (-)" aria-label="Zoom out">−</button>
                            <div id="zoom-level" aria-live="polite" aria-atomic="true">100%</div>
                            <button class="zoom-btn" title="Zoom in (+)" aria-label="Zoom in">+</button>
                            <button class="btn btn-secondary btn-small" title="Reset view (0)" aria-label="Reset view">Reset</button>
                        </div>
                        <button class="btn btn-secondary btn-small" id="dark-mode-toggle" title="Toggle dark mode" aria-label="Toggle dark mode" aria-pressed="false">
                            <svg id="dark-mode-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                            </svg>
                        </button>
                        <button class="btn btn-primary btn-small" id="toggle-sidebar-btn" aria-label="Toggle node details sidebar" aria-expanded="false">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            <span>Node Details</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Minimap -->
            <div class="minimap" id="minimap" role="region" aria-label="Diagram minimap">
                <div class="minimap-header">
                    <span class="minimap-title">Map</span>
                    <button class="minimap-close" aria-label="Close minimap">&times;</button>
                </div>
                <div class="minimap-container" id="minimap-container" aria-label="Minimap overview">
                    <div class="minimap-viewport" id="minimap-viewport" role="img" aria-label="Current viewport indicator"></div>
                </div>
            </div>
            <button class="minimap-toggle" id="minimap-toggle" aria-label="Toggle minimap" aria-expanded="false">🗺️ Map</button>

            <div id="content-wrapper">
                <div id="svg-wrapper">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <div>Loading diagram...</div>
                    </div>
                </div>
            </div>
        </div>

        <div id="sidebar" role="complementary" aria-label="Node details panel" aria-hidden="true">
            <div id="sidebar-content">
                <button class="close-btn" aria-label="Close sidebar">&times;</button>
                <div class="sidebar-header">
                    <h2 id="node-title">Select a Node</h2>
                    <p id="node-id" aria-live="polite">Click any node on the diagram to view details</p>
                </div>

                <div class="sidebar-section">
                    <h3 class="section-title">Basic Information</h3>
                    <div class="form-group">
                        <label for="node-name">Node Name</label>
                        <input type="text" id="node-name" readonly>
                    </div>

                    <div class="form-group">
                        <label for="node-description">Description</label>
                        <textarea id="node-description" rows="4" readonly></textarea>
                    </div>
                </div>

                <div class="sidebar-section">
                    <h3 class="section-title">Attached Links</h3>
                    <ul class="links-list" id="links-list">
                        <li class="empty-state">Select a node to view links</li>
                    </ul>
                </div>

                <div class="sidebar-section">
                    <h3 class="section-title">Attached Files</h3>
                    <ul class="files-list" id="files-list">
                        <li class="empty-state">Select a node to view files</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
EOHTML

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Production files created in: $PROD_DIR/"
echo ""
echo "🚀 To deploy:"
echo "   1. Test locally: cd $PROD_DIR && python3 -m http.server 8000"
echo "   2. Deploy to GitHub Pages: Copy contents to gh-pages branch"
echo "   3. Or deploy to any static hosting service"
echo ""
echo "💡 The production version is:"
echo "   ✓ Read-only (no editing)"
echo "   ✓ All data baked in"
echo "   ✓ No dev mode"
echo "   ✓ Optimized for performance"
echo ""
