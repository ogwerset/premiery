# 🏗️ Production Build Guide

This document explains how to create a **read-only production build** of your workflow diagram app.

## 📋 Table of Contents

- [Overview](#overview)
- [When to Use](#when-to-use)
- [Quick Start](#quick-start)
- [Step-by-Step Guide](#step-by-step-guide)
- [What Gets Removed](#what-gets-removed)
- [What Stays](#what-stays)
- [Performance Optimization](#performance-optimization)
- [Deployment](#deployment)

---

## Overview

The `build-readonly.sh` script creates a **production-ready, read-only version** of your workflow diagram with all your data permanently baked in. Perfect for shipping to end users who don't need editing capabilities.

### Key Features:
- ✅ All node data embedded directly in the JavaScript
- ✅ No localStorage dependencies
- ✅ Dev mode completely removed
- ✅ Smaller, faster, cleaner
- ✅ Still fully interactive (view, zoom, pan, dark mode)
- ✅ Mobile responsive with all accessibility features

---

## When to Use

Use the production build when:
1. ✅ You've finished entering all your workflow data
2. ✅ You want to share with end users (read-only access)
3. ✅ You need a static, deployable version
4. ✅ You want to deploy to GitHub Pages, Netlify, Vercel, etc.

**Don't use** the production build if:
- ❌ You still need to edit node data
- ❌ You want users to make their own annotations
- ❌ You need the export/import functionality

---

## Quick Start

```bash
# 1. Export your current data
# Open the app, click "Eksportuj", save as workflow-data.json

# 2. Run the build script
./build-readonly.sh

# 3. Test the production build
cd production
python3 -m http.server 8000
# Open http://localhost:8000

# 4. Deploy!
```

---

## Step-by-Step Guide

### Step 1: Prepare Your Data

1. Open your development app in a browser
2. Make sure all your node data is complete and accurate
3. Click the **"Eksportuj"** button in the toolbar
4. Save the file as `workflow-data.json` in your project root

```
premiery/
├── workflow-data.json  ← Save it here
├── build-readonly.sh
├── index.html
└── ...
```

### Step 2: Run the Build Script

```bash
chmod +x build-readonly.sh  # Make it executable (first time only)
./build-readonly.sh
```

You'll see output like:
```
🚀 Building Read-Only Production Version...

📁 Creating production directory structure...
💾 Exporting current data from localStorage...
✅ Found workflow-data.json
🔧 Creating read-only JavaScript...
📝 Injecting production data...

✅ Build complete!

📦 Production files created in: production/
```

### Step 3: Test the Production Build

```bash
cd production
python3 -m http.server 8000
```

Open http://localhost:8000 and verify:
- ✅ All nodes have your data
- ✅ Links and files are visible
- ✅ No dev mode or editing UI
- ✅ Everything is read-only
- ✅ Dark mode works
- ✅ Minimap works
- ✅ Mobile responsive

### Step 4: Deploy

**GitHub Pages:**
```bash
cp -r production/* ../your-gh-pages-repo/
cd ../your-gh-pages-repo
git add .
git commit -m "Deploy production build"
git push
```

**Netlify/Vercel:**
- Drag and drop the `production/` folder
- Or connect your Git repo and set build command to `./build-readonly.sh`

**Your Own Server:**
```bash
scp -r production/* user@yourserver:/var/www/html/workflow/
```

---

## What Gets Removed

The production build removes all development features:

### Removed from HTML:
- ❌ Mode toggle button (Dev/View)
- ❌ Export/Import buttons
- ❌ Dev mode indicator
- ❌ Save changes button
- ❌ Add link/file forms
- ❌ Delete buttons for links/files
- ❌ All editing controls

### Removed from JavaScript:
- ❌ LocalStorage saving (data is baked in)
- ❌ `saveToLocalStorage()` function
- ❌ `saveNodeData()` function
- ❌ Export/import functionality
- ❌ Mode toggle logic
- ❌ All edit event handlers

### What Changes:
- ✏️ Inputs become `readonly`
- ✏️ `openNodeEditor()` becomes `openNodeViewer()`
- ✏️ Data is hardcoded as `PRODUCTION_DATA`

---

## What Stays

The production build keeps all viewer features:

### Fully Functional:
- ✅ Click nodes to view details
- ✅ Keyboard navigation (Tab, Enter, Space)
- ✅ Zoom in/out controls
- ✅ Pan and drag
- ✅ Dark mode toggle
- ✅ Minimap with viewport tracking
- ✅ Mobile hamburger menu
- ✅ Touch gestures (pinch-to-zoom)
- ✅ All accessibility features (ARIA labels, focus indicators)
- ✅ Responsive design

### Your Data:
- ✅ All node names
- ✅ All descriptions
- ✅ All links (clickable)
- ✅ All file attachments

---

## Performance Optimization

### SVG Optimization

The build script includes SVG file size optimization:

```bash
# Install SVGO (one-time)
npm install -g svgo

# Run optimization
./optimize-svg.sh
```

**Expected Results:**
- Original SVG: ~1.4MB
- Optimized SVG: ~800KB-1.0MB (30-40% reduction)

**What it does:**
- Removes comments and metadata
- Minifies styles
- Removes unused namespaces
- Cleans up IDs
- Sorts attributes

### Additional Optimizations

**Before deployment, consider:**

1. **Enable gzip compression** on your server
   ```
   AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
   ```

2. **Add caching headers**
   ```
   <FilesMatch "\.(html|css|js|svg)$">
       Header set Cache-Control "max-age=31536000, public"
   </FilesMatch>
   ```

3. **Use a CDN** for the SVG file (if very large)

4. **Lazy load** the SVG (already implemented)

---

## Deployment Options

### Option 1: GitHub Pages (Free, Easiest)

1. Create a new branch:
   ```bash
   git checkout -b gh-pages
   ```

2. Copy production files:
   ```bash
   cp -r production/* .
   git add .
   git commit -m "Production deployment"
   git push origin gh-pages
   ```

3. Enable GitHub Pages in repo settings → Use `gh-pages` branch

4. Your site will be live at:
   ```
   https://YOUR-USERNAME.github.io/premiery/
   ```

### Option 2: Netlify (Free, Zero Config)

1. Create account at [netlify.com](https://netlify.com)
2. Drag and drop `production/` folder
3. Done! Auto HTTPS + CDN included

### Option 3: Vercel (Free, Zero Config)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   cd production
   vercel
   ```

### Option 4: Your Own Server

```bash
# Upload via SCP
scp -r production/* user@server:/var/www/html/

# Or upload via FTP/SFTP
# Use FileZilla, Cyberduck, or your preferred client
```

---

## Rebuilding

When you need to update the production build:

1. **Edit your data** in development mode
2. **Export** new `workflow-data.json`
3. **Re-run** `./build-readonly.sh`
4. **Test** the new build
5. **Deploy** updated `production/` folder

The script will:
- ✅ Overwrite the old production folder
- ✅ Inject your new data
- ✅ Maintain all optimizations

---

## Troubleshooting

### "workflow-data.json not found"
**Solution:** Export your data first:
1. Open dev app in browser
2. Click "Eksportuj" button
3. Save as `workflow-data.json` in project root

### "Permission denied: ./build-readonly.sh"
**Solution:** Make it executable:
```bash
chmod +x build-readonly.sh
```

### "Data not showing in production"
**Solution:** Check JSON format:
```bash
cat workflow-data.json | jq .
```
If error, re-export from browser.

### "SVG not loading"
**Solution:**
1. Check file exists: `ls production/assets/`
2. Check web server is running
3. Open browser console for errors

---

## Advanced: Customization

### Change Production Branding

Edit `build-readonly.sh` and modify the HTML generation section:

```bash
# Line ~550 in build-readonly.sh
<div class="toolbar-title">Workflow Diagram</div>  # ← Change this
<span>v1.5.0</span>  # ← Change version
```

### Remove Minimap in Production

Edit `build-readonly.sh`, find the HTML section and remove:
```html
<!-- Minimap -->
<div class="minimap" id="minimap">...</div>
<button class="minimap-toggle" id="minimap-toggle">🗺️ Map</button>
```

### Add Analytics

Add before `</head>` in the HTML generation:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## Security Notes

**The production build:**
- ✅ No user input (read-only)
- ✅ All links open in new tab with `rel="noopener"`
- ✅ No XSS vulnerabilities (static data)
- ✅ No authentication needed (public viewer)

**If you need authentication:**
- Use Netlify Identity
- Or Vercel Authentication
- Or add basic auth on your server

---

## Questions?

**Q: Can users export the data?**
A: No, export is removed in production. Data is baked into the JS.

**Q: Can I have multiple production builds?**
A: Yes! Run the script multiple times with different `workflow-data.json` files.

**Q: Does production support different languages?**
A: Yes, edit the text in the build script's HTML section.

**Q: How do I update a single node's data?**
A: You must rebuild. Edit in dev, export, rebuild, redeploy.

**Q: Can I password-protect the production build?**
A: Yes, use server-level authentication or hosting provider's auth features.

---

**Happy Deploying! 🚀**
