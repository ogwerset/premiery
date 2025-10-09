/**
 * Interactive Workflow Diagram - Application Logic
 * Version: 1.5.0 (Accessibility + Production Build)
 */

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
    SUCCESS_MESSAGE_DURATION: 2000,
    SVG_INIT_DELAY: 100
};

// ================================================
// State Management
// ================================================
const state = {
    panZoomInstance: null,
    currentNodeId: null,
    nodeData: {},
    selectedElement: null,
    minimapInitialized: false,
    lastMinimapUpdate: 0
};

// ================================================
// DOM Element Cache
// ================================================
const elements = {};

/**
 * Cache all DOM elements at initialization
 */
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
    elements.newLinkUrl = document.getElementById('new-link-url');
    elements.newFileName = document.getElementById('new-file-name');
    elements.zoomLevel = document.getElementById('zoom-level');
    elements.infoBanner = document.getElementById('info-banner');
    elements.bannerModeText = document.getElementById('banner-mode-text');
    elements.modeLabel = document.getElementById('mode-label');
    elements.darkModeIcon = document.getElementById('dark-mode-icon');
    elements.exportBtn = document.getElementById('export-btn');
    elements.importBtn = document.getElementById('import-btn');
    elements.importFileInput = document.getElementById('import-file-input');
    elements.minimap = document.getElementById('minimap');
    elements.minimapContainer = document.getElementById('minimap-container');
    elements.minimapViewport = document.getElementById('minimap-viewport');
    elements.minimapToggle = document.getElementById('minimap-toggle');
}

// ================================================
// Utility Functions
// ================================================

/**
 * Debounce function - limits rate of function execution
 */
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

/**
 * Throttle function - ensures function runs at most once per interval
 */
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

/**
 * Validate localStorage data structure
 */
function validateNodeData(data) {
    if (!data || typeof data !== 'object') return false;

    for (const nodeId in data) {
        const node = data[nodeId];
        if (!node.hasOwnProperty('name') ||
            !node.hasOwnProperty('description') ||
            !Array.isArray(node.links) ||
            !Array.isArray(node.files)) {
            return false;
        }
    }
    return true;
}

/**
 * Sanitize URL input
 */
function sanitizeUrl(url) {
    const trimmed = url.trim();
    if (!trimmed) return null;

    // Add protocol if missing
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return 'https://' + trimmed;
    }

    return trimmed;
}

// ================================================
// Data Management
// ================================================

/**
 * Load node data from localStorage with validation
 */
function loadNodeData() {
    try {
        const saved = localStorage.getItem('workflowNodeData');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (validateNodeData(parsed)) {
                state.nodeData = parsed;
            } else {
                console.warn('Invalid nodeData structure in localStorage, starting fresh');
                state.nodeData = {};
            }
        }
    } catch (error) {
        console.error('Error loading nodeData from localStorage:', error);
        state.nodeData = {};
    }
}

/**
 * Save node data to localStorage
 */
function saveToLocalStorage() {
    try {
        localStorage.setItem('workflowNodeData', JSON.stringify(state.nodeData));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// ================================================
// SVG Loading & Initialization
// ================================================

/**
 * Load and display SVG diagram
 */
async function loadSVG() {
    try {
        const response = await fetch('assets/flowchart-processed.svg');
        const svgText = await response.text();
        elements.svgWrapper.innerHTML = svgText;

        // Initialize pan-zoom after SVG is loaded
        setTimeout(() => {
            const svgElement = document.querySelector('#svg-wrapper svg');
            if (svgElement) {
                initializePanZoom(svgElement);
                makeNodesClickable();
                // Apply dark mode background if enabled
                const isDarkMode = document.body.classList.contains('dark-mode');
                updateSvgBackground(isDarkMode);
                // Initialize minimap automatically after SVG is ready
                setTimeout(() => {
                    initMinimap();
                }, 200);
            }
        }, CONSTANTS.SVG_INIT_DELAY);
    } catch (error) {
        console.error('Error loading SVG:', error);
        elements.svgWrapper.innerHTML =
            '<div style="text-align: center; padding: 40px; color: #666;"><p>Error loading diagram. Make sure you are viewing this through a web server.</p><p style="margin-top: 10px; font-size: 13px;">Run: <code>python3 -m http.server 8000</code></p></div>';
    }
}

/**
 * Initialize pan-zoom functionality with debounced updates and touch support
 */
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
        // Enable touch events for mobile
        dblClickZoomEnabled: false, // Disable to prevent conflict with touch
        preventMouseEventsDefault: true
    });

    // Debounced zoom level update
    const debouncedZoomUpdate = debounce((level) => {
        elements.zoomLevel.textContent = Math.round(level * 100) + '%';
    }, CONSTANTS.ZOOM_DEBOUNCE_MS);

    // Throttled minimap viewport update
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

    // Add pinch-to-zoom support for mobile
    enablePinchZoom(svgElement);
}

/**
 * Enable pinch-to-zoom gesture for mobile devices
 */
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

            // Apply zoom with constraints
            const minZoom = 0.1;
            const maxZoom = 5;
            const constrainedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

            state.panZoomInstance.zoom(constrainedZoom);
        }
    }, { passive: false });

    function getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

/**
 * Make all nodes clickable with touch support and keyboard navigation
 */
function makeNodesClickable() {
    const svgElement = document.querySelector('#svg-wrapper svg');
    if (!svgElement) return;

    const nodes = svgElement.querySelectorAll('g[data-cell-id]');

    nodes.forEach((node, index) => {
        const nodeId = node.getAttribute('data-cell-id');
        if (nodeId === '0' || nodeId === '1') return;

        const hasContent = node.querySelector('rect, ellipse, path, text, image');
        if (!hasContent) return;

        // Mark as interactive for CSS styling
        node.classList.add('node-interactive');

        // Make keyboard accessible
        node.setAttribute('role', 'button');
        node.setAttribute('tabindex', '0');
        node.setAttribute('aria-label', `Workflow node ${nodeId}`);

        // Click handler for desktop
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            openNodeEditor(nodeId, node);
        });

        // Keyboard navigation
        node.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                openNodeEditor(nodeId, node);
            }
        });

        // Touch support for mobile highlighting
        node.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            node.style.opacity = '0.75';
        }, { passive: true });

        node.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setTimeout(() => {
                node.style.opacity = '';
                openNodeEditor(nodeId, node);
            }, 100);
        });

        node.addEventListener('touchcancel', () => {
            node.style.opacity = '';
        }, { passive: true });
    });
}

// ================================================
// Node Editor / Sidebar
// ================================================

/**
 * Open node editor sidebar
 */
function openNodeEditor(nodeId, element) {
    // Remove selection from previously selected node
    if (state.selectedElement) {
        state.selectedElement.classList.remove('node-selected');
        state.selectedElement.removeAttribute('aria-selected');
    }

    state.currentNodeId = nodeId;
    state.selectedElement = element;

    // Add selection to new node
    if (state.selectedElement) {
        state.selectedElement.classList.add('node-selected');
        state.selectedElement.setAttribute('aria-selected', 'true');
    }

    // Get node text content
    const textElement = element.querySelector('text');
    const nodeText = textElement ? textElement.textContent.trim() : 'Nienazwany węzeł';

    // Load existing data or create new
    if (!state.nodeData[nodeId]) {
        state.nodeData[nodeId] = {
            name: nodeText,
            description: '',
            links: [],
            files: []
        };
    }

    // Populate form
    elements.nodeTitle.textContent = nodeText;
    elements.nodeId.textContent = `Node ID: ${nodeId}`;
    elements.nodeName.value = state.nodeData[nodeId].name;
    elements.nodeDescription.value = state.nodeData[nodeId].description;

    renderLinks();
    renderFiles();

    // Apply current mode settings
    const isViewMode = document.body.classList.contains('view-mode');
    updateModeUI(isViewMode);

    elements.sidebar.classList.add('open');
    elements.toggleSidebarBtn.innerHTML = `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <span>Close Panel</span>
    `;
}

/**
 * Toggle sidebar open/close
 */
function toggleSidebar() {
    if (elements.sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        elements.sidebar.classList.add('open');
        elements.sidebar.setAttribute('aria-hidden', 'false');
        elements.toggleSidebarBtn.setAttribute('aria-expanded', 'true');
        elements.toggleSidebarBtn.innerHTML = `
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span>Close Panel</span>
        `;
    }
}

/**
 * Close sidebar and cleanup
 */
function closeSidebar() {
    console.log('closeSidebar called');

    // Remove selection from node
    if (state.selectedElement) {
        state.selectedElement.classList.remove('node-selected');
        state.selectedElement.removeAttribute('aria-selected');
    }

    elements.sidebar.classList.remove('open');
    elements.sidebar.setAttribute('aria-hidden', 'true');
    elements.toggleSidebarBtn.setAttribute('aria-expanded', 'false');
    elements.toggleSidebarBtn.innerHTML = `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
        <span>Szczegóły węzła</span>
    `;
    state.currentNodeId = null;
    state.selectedElement = null;

    console.log('Sidebar closed successfully');
}

/**
 * Save node data
 */
function saveNodeData() {
    if (!state.currentNodeId) return;

    state.nodeData[state.currentNodeId].name = elements.nodeName.value;
    state.nodeData[state.currentNodeId].description = elements.nodeDescription.value;

    saveToLocalStorage();

    const saveBtn = event.target;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✓ Zapisano!';
    saveBtn.style.background = '#2ecc71';

    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = '';
    }, CONSTANTS.SUCCESS_MESSAGE_DURATION);
}

// ================================================
// Links Management
// ================================================

/**
 * Render links list
 */
function renderLinks() {
    const links = state.nodeData[state.currentNodeId].links;

    if (links.length === 0) {
        elements.linksList.innerHTML = '<li class="empty-state">Brak załączonych linków</li>';
        return;
    }

    elements.linksList.innerHTML = links.map((link, index) => `
        <li class="link-item">
            <a href="${link}" target="_blank" rel="noopener">${link}</a>
            <button class="btn btn-danger btn-small" data-remove-link="${index}">×</button>
        </li>
    `).join('');
}

/**
 * Add link to current node
 */
function addLink() {
    if (!state.currentNodeId) {
        alert('Najpierw wybierz węzeł');
        return;
    }

    const url = sanitizeUrl(elements.newLinkUrl.value);
    if (!url) return;

    state.nodeData[state.currentNodeId].links.push(url);
    elements.newLinkUrl.value = '';

    renderLinks();
    saveToLocalStorage();
}

/**
 * Remove link from current node
 */
function removeLink(index) {
    if (!state.currentNodeId) return;

    state.nodeData[state.currentNodeId].links.splice(index, 1);
    renderLinks();
    saveToLocalStorage();
}

// ================================================
// Files Management
// ================================================

/**
 * Render files list
 */
function renderFiles() {
    const files = state.nodeData[state.currentNodeId].files;

    if (files.length === 0) {
        elements.filesList.innerHTML = '<li class="empty-state">Brak załączonych plików</li>';
        return;
    }

    elements.filesList.innerHTML = files.map((file, index) => `
        <li class="file-item">
            <span>${file}</span>
            <button class="btn btn-danger btn-small" data-remove-file="${index}">×</button>
        </li>
    `).join('');
}

/**
 * Add file to current node
 */
function addFile() {
    if (!state.currentNodeId) {
        alert('Najpierw wybierz węzeł');
        return;
    }

    const fileName = elements.newFileName.value.trim();
    if (!fileName) return;

    state.nodeData[state.currentNodeId].files.push(fileName);
    elements.newFileName.value = '';

    renderFiles();
    saveToLocalStorage();
}

/**
 * Remove file from current node
 */
function removeFile(index) {
    if (!state.currentNodeId) return;

    state.nodeData[state.currentNodeId].files.splice(index, 1);
    renderFiles();
    saveToLocalStorage();
}

// ================================================
// Mode Management (Dev/View)
// ================================================

/**
 * Toggle between dev and view mode
 */
function toggleMode() {
    const isViewMode = document.body.classList.toggle('view-mode');
    localStorage.setItem('viewMode', isViewMode);
    updateModeUI(isViewMode);
    updateExportImportButtons(isViewMode);
}

/**
 * Update UI based on current mode
 */
function updateModeUI(isViewMode) {
    if (isViewMode) {
        elements.modeLabel.textContent = 'Tryb widoku';
        elements.bannerModeText.textContent = '🖱️ Kliknij dowolny węzeł, aby wyświetlić szczegóły';
        if (state.currentNodeId) {
            elements.nodeId.textContent = `ID węzła: ${state.currentNodeId}`;
        } else {
            elements.nodeId.textContent = 'Kliknij dowolny węzeł na diagramie, aby wyświetlić';
        }
        elements.nodeName.setAttribute('readonly', 'readonly');
        elements.nodeDescription.setAttribute('readonly', 'readonly');
    } else {
        elements.modeLabel.textContent = 'Tryb Dev';
        elements.bannerModeText.textContent = '🖱️ Kliknij dowolny węzeł, aby wyświetlić/edytować szczegóły';
        if (state.currentNodeId) {
            elements.nodeId.textContent = `ID węzła: ${state.currentNodeId}`;
        } else {
            elements.nodeId.textContent = 'Kliknij dowolny węzeł na diagramie, aby edytować';
        }
        elements.nodeName.removeAttribute('readonly');
        elements.nodeDescription.removeAttribute('readonly');
    }
}

/**
 * Initialize mode from localStorage
 */
function initMode() {
    const isViewMode = localStorage.getItem('viewMode') === 'true';
    if (isViewMode) {
        document.body.classList.add('view-mode');
    }
    updateModeUI(isViewMode);
    updateExportImportButtons(isViewMode);
}

/**
 * Update export/import buttons visibility
 */
function updateExportImportButtons(isViewMode) {
    if (isViewMode) {
        elements.exportBtn.style.display = 'none';
        elements.importBtn.style.display = 'flex';
    } else {
        elements.exportBtn.style.display = 'flex';
        elements.importBtn.style.display = 'none';
    }
}

// ================================================
// Dark Mode
// ================================================

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    updateDarkModeIcon(isDarkMode);
    updateSvgBackground(isDarkMode);

    // Update ARIA state
    const darkModeBtn = document.getElementById('dark-mode-toggle');
    if (darkModeBtn) {
        darkModeBtn.setAttribute('aria-pressed', isDarkMode.toString());
    }
}

/**
 * Update dark mode icon
 */
function updateDarkModeIcon(isDarkMode) {
    if (isDarkMode) {
        // Sun icon for light mode
        elements.darkModeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>';
    } else {
        // Moon icon for dark mode
        elements.darkModeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>';
    }
}

/**
 * Update SVG background color for dark mode
 */
function updateSvgBackground(isDarkMode) {
    const svgElement = document.querySelector('#svg-wrapper svg');
    if (svgElement) {
        if (isDarkMode) {
            svgElement.style.background = 'var(--bg-secondary)';
        } else {
            svgElement.style.background = 'white';
        }
    }

    // Also update minimap SVG
    const minimapSvg = elements.minimapContainer?.querySelector('svg');
    if (minimapSvg) {
        if (isDarkMode) {
            minimapSvg.style.background = 'var(--bg-tertiary)';
        } else {
            minimapSvg.style.background = 'white';
        }
    }
}

/**
 * Initialize dark mode with system preference detection
 */
function initDarkMode() {
    const savedDarkMode = localStorage.getItem('darkMode');

    if (savedDarkMode !== null) {
        if (savedDarkMode === 'true') {
            document.body.classList.add('dark-mode');
            updateDarkModeIcon(true);
            updateSvgBackground(true);
        }
    } else {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
            updateDarkModeIcon(true);
            updateSvgBackground(true);
        }
    }

    // Listen for system preference changes
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
// Export/Import
// ================================================

/**
 * Export node data as JSON
 */
function exportData() {
    const dataStr = JSON.stringify(state.nodeData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'workflow-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success message
    const originalHTML = elements.exportBtn.innerHTML;
    elements.exportBtn.innerHTML = '<span>✓ Wyeksportowano!</span>';
    elements.exportBtn.style.background = '#2ecc71';
    setTimeout(() => {
        elements.exportBtn.innerHTML = originalHTML;
        elements.exportBtn.style.background = '';
    }, CONSTANTS.SUCCESS_MESSAGE_DURATION);
}

/**
 * Trigger import file dialog
 */
function triggerImport() {
    elements.importFileInput.click();
}

/**
 * Import node data from JSON
 */
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);

            if (!validateNodeData(imported)) {
                throw new Error('Invalid data format');
            }

            state.nodeData = imported;
            saveToLocalStorage();

            // Show success message
            const originalHTML = elements.importBtn.innerHTML;
            elements.importBtn.innerHTML = '<span>✓ Zaimportowano!</span>';
            elements.importBtn.style.background = '#2ecc71';
            setTimeout(() => {
                elements.importBtn.innerHTML = originalHTML;
                elements.importBtn.style.background = '';
            }, CONSTANTS.SUCCESS_MESSAGE_DURATION);

            // Refresh current node if open
            if (state.currentNodeId && state.nodeData[state.currentNodeId]) {
                elements.nodeName.value = state.nodeData[state.currentNodeId].name;
                elements.nodeDescription.value = state.nodeData[state.currentNodeId].description;
                renderLinks();
                renderFiles();
            }
        } catch (error) {
            alert('Błąd importu: Nieprawidłowy format pliku JSON');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

// ================================================
// Minimap
// ================================================

/**
 * Initialize minimap (lazy loaded)
 */
function initMinimap() {
    if (state.minimapInitialized) {
        console.log('Minimap already initialized');
        return;
    }

    console.log('Initializing minimap...');

    const svgWrapper = elements.svgWrapper;
    const svgElement = svgWrapper.querySelector('svg');
    if (!svgElement) {
        console.error('SVG element not found for minimap initialization');
        return;
    }

    // Clone SVG for minimap
    const svgClone = svgElement.cloneNode(true);
    console.log('SVG cloned for minimap');

    // Remove interactivity from clone
    svgClone.querySelectorAll('.node-interactive').forEach(node => {
        node.classList.remove('node-interactive');
        node.style.cursor = 'default';
        node.style.pointerEvents = 'none';
    });

    // Remove any existing SVG from minimap
    const existingSvg = elements.minimapContainer.querySelector('svg');
    if (existingSvg) {
        existingSvg.remove();
    }

    // Set proper dimensions for the cloned SVG
    svgClone.style.width = '100%';
    svgClone.style.height = '100%';
    svgClone.style.display = 'block';

    // Apply dark mode if enabled
    const isDarkMode = document.body.classList.contains('dark-mode');
    if (isDarkMode) {
        svgClone.style.background = 'var(--bg-tertiary)';
    } else {
        svgClone.style.background = 'white';
    }

    // Insert SVG before viewport
    elements.minimapContainer.insertBefore(svgClone, elements.minimapViewport);
    console.log('SVG inserted into minimap container');

    // Initialize viewport rectangle
    updateMinimapViewport();

    // Make viewport draggable
    makeViewportDraggable();

    // Show minimap by default on first load
    const minimapHidden = localStorage.getItem('minimapHidden');
    if (minimapHidden === 'true') {
        elements.minimap.classList.add('hidden');
        elements.minimapToggle.classList.remove('with-minimap');
        console.log('Minimap hidden by user preference');
    } else {
        // Show minimap by default
        elements.minimap.classList.remove('hidden');
        elements.minimapToggle.classList.add('with-minimap');
        console.log('Minimap shown');
    }

    state.minimapInitialized = true;
    console.log('Minimap initialization complete');
}

/**
 * Update minimap viewport indicator
 */
function updateMinimapViewport() {
    if (!state.panZoomInstance || !state.minimapInitialized) {
        console.log('Cannot update minimap viewport: panZoom or minimap not initialized');
        return;
    }

    const viewport = elements.minimapViewport;
    const minimap = elements.minimap;
    const minimapContainer = elements.minimapContainer;
    const svgElement = document.querySelector('#svg-wrapper svg');

    if (!viewport || !svgElement) {
        console.error('Minimap viewport or SVG element not found');
        return;
    }

    if (minimap.classList.contains('hidden')) return;

    try {
        const pan = state.panZoomInstance.getPan();
        const zoom = state.panZoomInstance.getZoom();
        const sizes = state.panZoomInstance.getSizes();

        // Calculate viewport position and size
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

/**
 * Make minimap viewport draggable with touch support
 */
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

    // Mouse events for desktop
    viewport.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.preventDefault();
    });

    minimapContainer.addEventListener('click', (e) => {
        if (e.target === viewport) return;
        moveViewport(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            moveViewport(e.clientX, e.clientY);
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch events for mobile
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

/**
 * Toggle minimap visibility
 */
function toggleMinimap() {
    // Lazy load minimap on first open
    if (!state.minimapInitialized) {
        initMinimap();
    }

    const isHidden = elements.minimap.classList.toggle('hidden');
    localStorage.setItem('minimapHidden', isHidden);

    // Update ARIA state
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

/**
 * Zoom in
 */
function zoomIn() {
    if (state.panZoomInstance) {
        state.panZoomInstance.zoomIn();
    }
}

/**
 * Zoom out
 */
function zoomOut() {
    if (state.panZoomInstance) {
        state.panZoomInstance.zoomOut();
    }
}

/**
 * Reset zoom and center
 */
function resetZoom() {
    if (state.panZoomInstance) {
        state.panZoomInstance.reset();
        state.panZoomInstance.fit();
        state.panZoomInstance.center();
    }
}

// ================================================
// Info Banner
// ================================================

/**
 * Close info banner
 */
function closeInfoBanner() {
    elements.infoBanner.classList.add('hidden');
    localStorage.setItem('infoBannerClosed', 'true');
}

/**
 * Initialize info banner state
 */
function initInfoBanner() {
    if (localStorage.getItem('infoBannerClosed') === 'true') {
        elements.infoBanner.classList.add('hidden');
    }
}

/**
 * Close dev mode indicator
 */
function closeDevModeIndicator() {
    const devModeIndicator = document.getElementById('dev-mode-indicator');
    if (devModeIndicator) {
        devModeIndicator.classList.add('hidden');
        localStorage.setItem('devModeIndicatorClosed', 'true');
    }
}

/**
 * Initialize dev mode indicator state
 */
function initDevModeIndicator() {
    const devModeIndicator = document.getElementById('dev-mode-indicator');
    if (localStorage.getItem('devModeIndicatorClosed') === 'true') {
        devModeIndicator.classList.add('hidden');
    }
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    const toolbarControls = document.querySelector('.toolbar-controls');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');

    if (toolbarControls) {
        const isOpen = toolbarControls.classList.toggle('open');

        // Update ARIA state
        if (mobileMenuToggle) {
            mobileMenuToggle.setAttribute('aria-expanded', isOpen.toString());
        }
    }
}

/**
 * Close mobile menu (e.g., when clicking a button inside)
 */
function closeMobileMenu() {
    const toolbarControls = document.querySelector('.toolbar-controls');
    if (toolbarControls && window.innerWidth <= 767) {
        toolbarControls.classList.remove('open');
    }
}

// ================================================
// Event Listeners Setup
// ================================================

/**
 * Setup all event listeners using event delegation
 */
function setupEventListeners() {
    // Sidebar controls
    document.getElementById('toggle-sidebar-btn').addEventListener('click', toggleSidebar);

    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSidebar();
        });
        console.log('Close button event listener attached successfully');
    } else {
        console.error('Close button not found in DOM');
    }

    // Save button
    document.querySelector('.button-group .btn-primary').addEventListener('click', saveNodeData);

    // Links management
    document.querySelector('.add-link-form .btn-primary').addEventListener('click', addLink);
    elements.linksList.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove-link]');
        if (btn) {
            const index = parseInt(btn.getAttribute('data-remove-link'));
            removeLink(index);
        }
    });

    // Files management
    document.querySelector('.add-file-form .btn-primary').addEventListener('click', addFile);
    elements.filesList.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove-file]');
        if (btn) {
            const index = parseInt(btn.getAttribute('data-remove-file'));
            removeFile(index);
        }
    });

    // Zoom controls
    document.querySelectorAll('.zoom-btn')[0].addEventListener('click', zoomOut);
    document.querySelectorAll('.zoom-btn')[1].addEventListener('click', zoomIn);
    document.querySelector('.zoom-controls .btn-secondary').addEventListener('click', resetZoom);

    // Mode toggle
    document.getElementById('mode-toggle-btn').addEventListener('click', toggleMode);

    // Dark mode
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

    // Export/Import
    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('import-btn').addEventListener('click', triggerImport);
    elements.importFileInput.addEventListener('change', importData);

    // Minimap
    document.getElementById('minimap-toggle').addEventListener('click', toggleMinimap);
    document.querySelector('.minimap-close').addEventListener('click', toggleMinimap);

    // Info banner
    document.querySelector('.info-close').addEventListener('click', closeInfoBanner);

    // Dev mode indicator
    const devModeClose = document.querySelector('.dev-mode-close');
    if (devModeClose) {
        devModeClose.addEventListener('click', closeDevModeIndicator);
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Close mobile menu when clicking buttons inside
    const toolbarControls = document.querySelector('.toolbar-controls');
    if (toolbarControls) {
        toolbarControls.addEventListener('click', (e) => {
            if (e.target.closest('.btn')) {
                setTimeout(closeMobileMenu, 100);
            }
        });
    }

    // Keyboard shortcuts
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

/**
 * Initialize application
 */
function initializeApp() {
    cacheDOMElements();
    loadNodeData();
    initMode();
    initDarkMode();
    initInfoBanner();
    initDevModeIndicator();
    setupEventListeners();
    loadSVG();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
