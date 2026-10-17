# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FancyText is a Progressive Web App (PWA) that converts regular text to styled Unicode fonts (bold, italic, monospace). It supports offline functionality and Web Share Target API integration for receiving shared text from other apps.

## Architecture

- **Frontend**: Vanilla JavaScript ES6 modules with no build system or dependencies
- **PWA Features**: Service Worker for caching and Web Share Target API handling
- **Text Processing**: Unicode character mapping system for font style conversion
- **Share Integration**: the service worker stores shared data in the `share-store` cache; `share.html` reads it

### Key Files

- `index.html` - Main application interface
- `share.html` - Dedicated page for processing shared text via Web Share Target API
- `app.js` - Core text conversion logic and UI interactions
- `sw.js` - Service worker: network-first for pages and unversioned assets (falls back to the cached copy offline or after 4 s), cache-first for `?v=` assets; precaches every page for offline use and handles Web Share Target requests
- `qr-core.js` - Shared QR logic for `/generador-qr/`, `/qr-wifi/` and `/qr-whatsapp/` (URL validation, rendering with qrcode-generator in UTF-8 without BOM, PNG/SVG download with quiet zone)
- `scripts/og-images.py` - Generates the 1200x630 Open Graph images in `og/` (dev only, not shipped)
- `manifest.webmanifest` - PWA configuration with share target registration

### Text Conversion System

The app uses character mapping via `Map` objects to convert regular characters to Unicode styled equivalents:
- Bold: Mathematical Bold characters (𝐀-𝐳, 𝟎-𝟗)
- Italic: Mathematical Italic characters (𝑨-𝒛)  
- Monospace: Fullwidth characters (Ａ-ｚ, ０-９)

Whole links (`https://...`), hashtags (`#tag`) and mentions (`@user`) are left unconverted so they keep working (`TAG_RE` in `app.js`).

### PWA Share Target Flow

1. External app shares text → Service Worker intercepts POST to `/share`
2. Service Worker stores the form data in the `share-store` cache and redirects to `/share`
3. `/share.html` reads the payload from the cache and populates the editor (and offers "Crear QR del enlace" if it contains a URL)
4. Auto-applies bold styling to shared content

## Development

Since this is a vanilla JavaScript PWA with no build system:
- Serve files with a local HTTP server (e.g., `python -m http.server` or `npx serve .`)
- Test PWA features require HTTPS (use ngrok or similar for mobile testing)
- Any change to `styles.css`, `app.js`, `tools.js`, `qr-core.js` or `sponsored-banner.js` needs a `CACHE_VERSION` bump in `sw.js` (they are cached by `?v=` URL forever). When testing in a browser, unregister the service worker and clear caches first
- Shared nav and footer live in `nav-component.html`. After editing it, adding a page, or bumping `CACHE_VERSION` in `sw.js`, run `node update-nav.js`: it syncs nav/footer/sponsored banner into every page, pins Alpine.js and appends `?v=<CACHE_VERSION>` to `styles.css`, `app.js`, `tools.js` and `sponsored-banner.js` (also in `sw.js`)
- Test nginx changes with the real image: `docker build -t fancytext-test . && docker run --rm -p 8766:80 fancytext-test`

## Testing

No automated test framework is configured. Test manually by:
- Verifying text conversion for all three styles
- Testing copy/share functionality
- Validating PWA installation and offline behavior
- Testing Web Share Target integration on mobile devices

## Deployment

### Railway Deployment

The project includes Docker configuration for deployment on Railway:

- `Dockerfile` - Uses nginx:alpine for lightweight serving
- `nginx.conf` - Custom nginx configuration with PWA optimizations
- `.dockerignore` - Excludes unnecessary files from Docker build

**Key nginx features:**
- Gzip compression for better performance
- Correct MIME types for PWA manifest and service worker
- Cache headers for static assets
- Security headers
- Support for Web Share Target POST requests to `/share`

**Deploy to Railway:**
1. Connect repository to Railway
2. Railway automatically detects Dockerfile
3. Deploy with default settings (exposes port 80)