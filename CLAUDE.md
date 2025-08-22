# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FancyText is a Progressive Web App (PWA) that converts regular text to styled Unicode fonts (bold, italic, monospace). It supports offline functionality and Web Share Target API integration for receiving shared text from other apps.

## Architecture

- **Frontend**: Vanilla JavaScript ES6 modules with no build system or dependencies
- **PWA Features**: Service Worker for caching and Web Share Target API handling
- **Text Processing**: Unicode character mapping system for font style conversion
- **Share Integration**: BroadcastChannel API for communication between service worker and UI

### Key Files

- `index.html` - Main application interface
- `share.html` - Dedicated page for processing shared text via Web Share Target API
- `app.js` - Core text conversion logic and UI interactions
- `sw.js` - Service worker handling caching and Web Share Target requests
- `manifest.webmanifest` - PWA configuration with share target registration

### Text Conversion System

The app uses character mapping via `Map` objects to convert regular characters to Unicode styled equivalents:
- Bold: Mathematical Bold characters (𝐀-𝐳, 𝟎-𝟗)
- Italic: Mathematical Italic characters (𝑨-𝒛)  
- Monospace: Fullwidth characters (Ａ-ｚ, ０-９)

Special handling preserves hashtags (#) and mentions (@) during conversion.

### PWA Share Target Flow

1. External app shares text → Service Worker intercepts POST to `/share`
2. Service Worker extracts form data and broadcasts via BroadcastChannel
3. `/share.html` receives broadcast and populates input field
4. Auto-applies bold styling to shared content

## Development

Since this is a vanilla JavaScript PWA with no build system:
- Serve files with a local HTTP server (e.g., `python -m http.server` or `npx serve .`)
- Test PWA features require HTTPS (use ngrok or similar for mobile testing)
- Service Worker changes require browser dev tools cache clearing

## Testing

No automated test framework is configured. Test manually by:
- Verifying text conversion for all three styles
- Testing copy/share functionality
- Validating PWA installation and offline behavior
- Testing Web Share Target integration on mobile devices