# Complete Guide: Cloudflare Worker for Webflow Image & Asset Optimization

**Version:** 4.3 (Production-Ready)  
**Last Updated:** January 2025

This is more of a techincal guide of how teh code works, to just start using the worker, please head straight to: https://www.milkmoonstudio.com/post/optimize-webflow-with-cloudflare-images-assets-caching-in-2026

---

## Table of Contents

1. [What This Does & What We're Achieving](#what-this-does--what-were-achieving)
2. [What Gets Optimized vs What Gets Proxied](#what-gets-optimized-vs-what-gets-proxied)
3. [How Cloudflare Optimizes Your Assets](#how-cloudflare-optimizes-your-assets)
4. [Prerequisites & Setup Guide](#prerequisites--setup-guide)
5. [Configuration & Environment Variables](#configuration--environment-variables)
6. [How Routes Work](#how-routes-work)
7. [Complete Code Walkthrough](#complete-code-walkthrough)
8. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## What This Does & What We're Achieving

### The Problem

Webflow hosts all your site's assets (images, CSS, JavaScript, fonts) on their CDN domains (`cdn.prod.website-files.com`, `assets.website-files.com`, etc.). While this works, it creates several limitations:

1. **No Cloudflare Image Optimization**: Cloudflare can't optimize images from external domains without proper configuration
2. **CORS Restrictions**: Cross-origin requests can be blocked or limited
3. **No Unified Caching**: Assets are scattered across different domains
4. **Performance**: Images aren't automatically converted to modern formats (AVIF/WebP)
5. **Social Media**: OG/Twitter images aren't optimized for social platforms

### The Solution

This Cloudflare Worker intercepts your HTML responses and rewrites all Webflow CDN URLs to be served through your own domain. This enables:

✅ **Cloudflare Image Transformations** - Automatic format conversion (AVIF/WebP)  
✅ **Edge Caching** - All assets cached at Cloudflare's global edge network  
✅ **CORS-Free Delivery** - Assets served from your domain  
✅ **Unified Performance** - Single domain for all assets  
✅ **Social Media Optimization** - OG/Twitter images optimized for better compatibility  
✅ **Works on Any Webflow Site** - Extension-based detection (not filename-based)

### What We're Optimizing

**Performance Goals:**
- Reduce image file sizes by 30-70% through modern format conversion
- Eliminate CORS issues for cross-origin asset loading
- Leverage Cloudflare's global edge network for faster delivery
- Cache all assets with 1-year TTL for optimal performance
- Optimize social media images for better sharing previews

**Compatibility Goals:**
- Work on any Webflow site without modification
- Handle all image contexts (src, srcset, CSS backgrounds, etc.)
- Support all asset types (CSS, JS, fonts, icons)
- Maintain backward compatibility with existing setups

---

## What Gets Optimized vs What Gets Proxied

### Images: Optimized via Cloudflare Image Resizing

**Transformable Images** (PNG, JPG, JPEG, WebP, GIF, SVG):
- **What happens:** Original image is proxied through `/img-original/`, then transformed via Cloudflare's Image Resizing service
- **Transformation:** Format conversion (AVIF/WebP), quality optimization, SVG sanitization
- **Result:** Smaller file sizes, modern formats, better performance
- **URL Pattern:** `https://yourdomain.com/cdn-cgi/image/format=auto,quality=85/https://yourdomain.com/img-original/https://cdn.prod.website-files.com/image.jpg`

**AVIF Images:**
- **What happens:** Proxied directly (already optimal format)
- **Transformation:** None (AVIF is already the best format)
- **Result:** Fast delivery from your domain, CORS-free
- **URL Pattern:** `https://yourdomain.com/img-cache/https://cdn.prod.website-files.com/image.avif`

**OG/Twitter Images:**
- **What happens:** Special handling with JPEG default (better social media compatibility)
- **Transformation:** Format conversion to JPEG (or PNG/WebP if configured), quality 80%
- **Result:** Better social media previews, faster loading
- **URL Pattern:** `https://yourdomain.com/cdn-cgi/image/format=jpeg,quality=80/https://yourdomain.com/img-original/https://cdn.prod.website-files.com/og-image.png`

### Assets: Proxied Only (No Transformation)

**CSS Files:**
- **What happens:** Proxied through `/asset-cache/`
- **Transformation:** None (CSS is already optimized by Webflow)
- **Result:** Cached on your domain, CORS-free, faster delivery
- **URL Pattern:** `https://yourdomain.com/asset-cache/https://cdn.prod.website-files.com/styles.css`

**JavaScript Files:**
- **What happens:** Proxied through `/asset-cache/`
- **Transformation:** None (JS is already minified by Webflow)
- **Result:** Cached on your domain, CORS-free, faster delivery
- **URL Pattern:** `https://yourdomain.com/asset-cache/https://cdn.prod.website-files.com/script.js`

**Fonts** (WOFF, WOFF2, TTF, OTF, EOT):
- **What happens:** Proxied through `/asset-cache/`
- **Transformation:** None (fonts are already optimized)
- **Result:** Cached on your domain, CORS-free, faster delivery
- **URL Pattern:** `https://yourdomain.com/asset-cache/https://cdn.prod.website-files.com/font.woff2`

**Icons** (ICO):
- **What happens:** Proxied through `/asset-cache/`
- **Transformation:** None
- **Result:** Cached on your domain, faster delivery
- **URL Pattern:** `https://yourdomain.com/asset-cache/https://cdn.prod.website-files.com/favicon.ico`

**Favicons & Apple Touch Icons:**
- **What happens:** Treated as images, optimized via Cloudflare Image Resizing
- **Transformation:** Format conversion, quality optimization
- **Result:** Smaller file sizes, modern formats
- **URL Pattern:** `https://yourdomain.com/cdn-cgi/image/format=avif,quality=85/https://yourdomain.com/img-original/https://cdn.prod.website-files.com/favicon.png`

---

## How Cloudflare Optimizes Your Assets

### Image Optimization Pipeline

**Step 1: HTML Transformation**
When a user requests your HTML page, the Worker intercepts the response and rewrites all image URLs:

```
Original: https://cdn.prod.website-files.com/image.jpg
Transformed: https://yourdomain.com/cdn-cgi/image/format=auto,quality=85/https://yourdomain.com/img-original/https://cdn.prod.website-files.com/image.jpg
```

**Step 2: Browser Requests Image**
The browser requests the transformed URL from your domain.

**Step 3: Cloudflare Image Resizing**
Cloudflare's Image Resizing service:
1. Extracts the original URL from the transform URL
2. Fetches the original from `/img-original/` (which proxies from Webflow CDN)
3. Transforms the image:
   - Converts format (AVIF for modern browsers, WebP for others)
   - Applies quality compression (85% default)
   - Sanitizes SVGs (removes scripts, preserves vector nature)
4. Caches the transformed image at edge
5. Serves to browser

**Step 4: Edge Caching**
- Transformed images cached at Cloudflare edge (1-year TTL)
- Original images cached at edge via `/img-original/` proxy
- Subsequent requests served from edge cache (fast!)

### Asset Proxying Pipeline

**Step 1: HTML Transformation**
Worker rewrites asset URLs in HTML:

```
Original: https://cdn.prod.website-files.com/styles.css
Transformed: https://yourdomain.com/asset-cache/https://cdn.prod.website-files.com/styles.css
```

**Step 2: Browser Requests Asset**
Browser requests from your domain.

**Step 3: Worker Proxies Asset**
Worker:
1. Extracts original URL from path
2. Fetches from Webflow CDN
3. Validates content type
4. Sets proper caching headers
5. Returns to browser

**Step 4: Edge Caching**
- Assets cached at Cloudflare edge (1-year TTL)
- Subsequent requests served from edge cache

### What Cloudflare Still Optimizes

Even though we're proxying assets, Cloudflare still applies its optimizations:

**For All Assets:**
- **Edge Caching** - Global distribution across 300+ data centers
- **HTTP/2 & HTTP/3** - Modern protocol support
- **Brotli Compression** - Automatic compression for text assets
- **TLS Optimization** - Fast SSL/TLS handshakes
- **DDoS Protection** - Built-in security

**For Images (via Image Resizing):**
- **Format Conversion** - AVIF/WebP based on browser support
- **Quality Optimization** - Configurable compression
- **SVG Sanitization** - Security improvements
- **On-the-fly Transformation** - No pre-processing needed

**For Text Assets (CSS/JS):**
- **Brotli Compression** - Automatic compression
- **Minification** - Already done by Webflow, preserved
- **Edge Caching** - Fast global delivery

---

## Prerequisites & Setup Guide

### Step 1: Enable Image Transformations

1. Go to **Cloudflare Dashboard** → Your Zone
2. Navigate to **Images** → **Transformations**
3. Click **Enable Image Transformations**
4. Wait for activation (usually instant)

**Why:** This enables Cloudflare's Image Resizing service, which transforms your images on-the-fly.

### Step 2: Add Allowed Origins

1. In **Images** → **Transformations**, go to **Sources**
2. Click **Add Source**
3. Add these origins (one at a time):
   - `cdn.prod.website-files.com`
   - `assets.website-files.com`
   - `assets-global.website-files.com`
   - `uploads-ssl.webflow.com`
   - **YOUR_DOMAIN** (e.g., `www.milkmoonstudio.com`) ← **CRITICAL!**

**Why:** Cloudflare needs permission to fetch images from these domains. Your domain is required because the transform URLs reference `/img-original/` on your domain.

**Alternative:** If available, use the wildcard `*.website-files.com` to cover all Webflow CDN subdomains.

### Step 3: Create the Worker

1. Go to **Workers & Pages** in Cloudflare Dashboard
2. Click **Create Application** → **Create Worker**
3. Name it (e.g., "webflow-asset-optimizer")
4. Copy the entire script from `cloudflare-worker-v4.2-hybrid.js`
5. Paste into the Worker editor
6. Click **Save and Deploy**

### Step 4: Configure Environment Variables

1. In your Worker, go to **Settings** → **Variables**
2. Add these variables (type: **Text**):

**REQUIRED:**
- **Variable:** `DOMAIN`  
  **Value:** `www.milkmoonstudio.com` (your domain)  
  **Note:** If not set, auto-detects from request URL

**OPTIONAL (with defaults):**
- **Variable:** `IMAGE_FORMAT`  
  **Value:** `auto` (or `webp`, `avif`)  
  **Default:** `auto`

- **Variable:** `IMAGE_QUALITY`  
  **Value:** `85` (1-100)  
  **Default:** `85`

- **Variable:** `OG_IMAGE_FORMAT`  
  **Value:** `jpeg` (or `png`, `webp`)  
  **Default:** `jpeg`

- **Variable:** `OG_IMAGE_QUALITY`  
  **Value:** `80` (1-100)  
  **Default:** `80`

- **Variable:** `EDGE_CACHE_TTL`  
  **Value:** `31536000` (seconds, 1 year)  
  **Default:** `31536000`

- **Variable:** `BROWSER_CACHE_TTL`  
  **Value:** `604800` (seconds, 1 week)  
  **Default:** `604800`

- **Variable:** `CATCH_ALL_EXTERNAL`  
  **Value:** `false` (or `true` to process all external assets)  
  **Default:** `false`

3. Click **Save**

### Step 5: Deploy Worker on Custom Domain

**IMPORTANT:** The Worker must be deployed on your custom domain, NOT on `*.workers.dev`.

1. In your Worker, go to **Triggers** → **Routes**
2. Click **Add Route**
3. Set route pattern: `*yourdomain.com/*` (e.g., `*milkmoonstudio.com/*`)
4. Select your zone
5. Click **Add Route**

**Why:** 
- Workers on `*.workers.dev` don't have access to Cache API
- Custom domain routes enable full caching functionality
- Required for proper edge caching

### Step 6: Verify It's Working

1. Visit your site: `https://www.yourdomain.com`
2. View page source (Right-click → View Source)
3. Check that image URLs are transformed:
   - Look for `/cdn-cgi/image/` in image URLs
   - Look for `/asset-cache/` in CSS/JS URLs
4. Check browser DevTools → Network tab:
   - Images should load from your domain
   - Assets should load from your domain
   - Check `X-Cache` header (HIT = cached, MISS = first request)

---

## Configuration & Environment Variables

### Required Variables

#### `DOMAIN`
- **Type:** Text
- **Example:** `www.milkmoonstudio.com`
- **Purpose:** Your domain name, used to build proxy URLs
- **Auto-detection:** If not set, detects from request URL
- **Validation:** Must be a valid domain format

### Optional Variables

#### `IMAGE_FORMAT`
- **Type:** Text
- **Values:** `auto`, `webp`, `avif`
- **Default:** `auto`
- **Purpose:** Image format for regular images
- **Recommendation:** Keep `auto` (serves AVIF to modern browsers, WebP to others)

#### `IMAGE_QUALITY`
- **Type:** Text (number)
- **Range:** 1-100
- **Default:** `85`
- **Purpose:** Image quality/compression level
- **Recommendation:** 85 is a good balance (higher = larger files, better quality)

#### `OG_IMAGE_FORMAT`
- **Type:** Text
- **Values:** `jpeg`, `png`, `webp`
- **Default:** `jpeg`
- **Purpose:** Format for OG/Twitter images (social media)
- **Why JPEG:** Better compatibility with social media platforms
- **Recommendation:** Keep `jpeg` unless you need transparency (then use `png`)

#### `OG_IMAGE_QUALITY`
- **Type:** Text (number)
- **Range:** 1-100
- **Default:** `80`
- **Purpose:** Quality for OG/Twitter images
- **Why 80:** Good balance for social media (faster loading, still good quality)

#### `EDGE_CACHE_TTL`
- **Type:** Text (number)
- **Default:** `31536000` (1 year in seconds)
- **Purpose:** How long Cloudflare caches assets at edge
- **Recommendation:** Keep default (1 year) for maximum performance

#### `BROWSER_CACHE_TTL`
- **Type:** Text (number)
- **Default:** `604800` (1 week in seconds)
- **Purpose:** How long browsers cache assets
- **Recommendation:** Keep default (1 week) or increase if assets rarely change

#### `CATCH_ALL_EXTERNAL`
- **Type:** Text
- **Values:** `true`, `false`
- **Default:** `false`
- **Purpose:** Process assets from ANY external domain (not just Webflow CDN)
- **Use Case:** If you have assets from other CDNs you want to optimize
- **Security:** Only enable if you trust all external domains
- **Recommendation:** Keep `false` unless needed

---

## How Routes Work

### Route Pattern

The Worker is deployed on: `*yourdomain.com/*`

This means it intercepts **all requests** to your domain:
- HTML pages: `/`, `/about`, `/contact`, etc.
- Image requests: `/cdn-cgi/image/...`, `/img-cache/...`, `/img-original/...`
- Asset requests: `/asset-cache/...`
- Everything else: Passes through to origin

### Request Flow

```
User Request → Cloudflare Edge → Worker (if route matches) → Origin (if needed)
```

**1. HTML Requests** (`/`, `/about`, etc.):
- Worker intercepts
- Fetches HTML from origin (with caching)
- Transforms URLs in HTML
- Returns transformed HTML

**2. Image Transform Requests** (`/cdn-cgi/image/...`):
- Cloudflare Image Resizing service handles this
- Extracts original URL from transform URL
- Fetches from `/img-original/` (which Worker proxies)
- Transforms and caches image
- Returns to browser

**3. Original Image Proxy** (`/img-original/...`):
- Worker intercepts
- Extracts original Webflow CDN URL
- Proxies from Webflow CDN
- Caches at edge
- Returns to Cloudflare Image Resizing service

**4. AVIF Image Proxy** (`/img-cache/...`):
- Worker intercepts
- Extracts original Webflow CDN URL
- Proxies AVIF from Webflow CDN
- Caches at edge
- Returns to browser

**5. Asset Proxy** (`/asset-cache/...`):
- Worker intercepts
- Extracts original Webflow CDN URL
- Proxies asset (CSS/JS/font/icon) from Webflow CDN
- Caches at edge
- Returns to browser

**6. Other Requests** (not matching above patterns):
- Worker passes through to origin
- No transformation applied

### URL Structure Examples

**Original Image:**
```
https://cdn.prod.website-files.com/63565c108c96756a59b92502/image.jpg
```

**Transformed (in HTML):**
```
https://www.milkmoonstudio.com/cdn-cgi/image/format=auto,quality=85/https://www.milkmoonstudio.com/img-original/https%3A%2F%2Fcdn.prod.website-files.com%2F63565c108c96756a59b92502%2Fimage.jpg
```

**Breakdown:**
- `/cdn-cgi/image/` - Cloudflare Image Resizing endpoint
- `format=auto,quality=85` - Transformation parameters
- `/https://www.milkmoonstudio.com/img-original/...` - Source URL (proxied original)
- The original URL is URL-encoded in the path

**AVIF Image:**
```
Original: https://cdn.prod.website-files.com/image.avif
Transformed: https://www.milkmoonstudio.com/img-cache/https%3A%2F%2Fcdn.prod.website-files.com%2Fimage.avif
```

**CSS Asset:**
```
Original: https://cdn.prod.website-files.com/styles.css
Transformed: https://www.milkmoonstudio.com/asset-cache/https%3A%2F%2Fcdn.prod.website-files.com%2Fstyles.css
```

---

## Complete Code Walkthrough

### File Structure Overview

The script is organized into logical sections:

1. **Header Documentation** (lines 1-110)
2. **Default Configuration** (lines 112-131)
3. **Constants** (lines 133-160)
4. **Worker Entry Point** (lines 162-170)
5. **Main Request Handler** (lines 172-231)
6. **Configuration Management** (lines 233-319)
7. **HTML Transformation** (lines 321-980)
8. **Proxy Handlers** (lines 982-1345)
9. **Utility Functions** (scattered throughout)

---

### Section 1: Header Documentation (Lines 1-110)

**Purpose:** Comprehensive documentation explaining what the script does, prerequisites, and configuration.

**Key Information:**
- What the script does (5 main functions)
- Configuration variables
- Prerequisites (Image Transformations, Allowed Origins, Custom Domain)
- How it works (request flow, caching strategy)

---

### Section 2: Default Configuration (Lines 112-131)

```javascript
const DEFAULT_CONFIG = {
  IMAGE_FORMAT: 'auto',
  IMAGE_QUALITY: 85,
  OG_IMAGE_FORMAT: 'jpeg',
  OG_IMAGE_QUALITY: 80,
  EDGE_CACHE_TTL: 31536000,    // 1 year
  BROWSER_CACHE_TTL: 604800,   // 1 week
  CATCH_ALL_EXTERNAL: false,
};
```

**Purpose:** Fallback values if environment variables aren't set.

**Why:** Ensures the script always has valid configuration, even if user forgets to set variables.

---

### Section 3: Constants (Lines 133-160)

**WEBFLOW_ORIGINS:**
```javascript
const WEBFLOW_ORIGINS = [
  'assets.website-files.com',
  'assets-global.website-files.com',
  'cdn.prod.website-files.com',
  'uploads-ssl.webflow.com',
];
```
**Purpose:** Defines which domains are considered "Webflow CDN" and should be processed.

**TRANSFORMABLE_EXTENSIONS:**
```javascript
const TRANSFORMABLE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
```
**Purpose:** File extensions that can be transformed via Cloudflare Image Resizing.

**PASSTHROUGH_EXTENSIONS:**
```javascript
const PASSTHROUGH_EXTENSIONS = ['avif'];
```
**Purpose:** Extensions that should be proxied only (no transformation).

**ASSET_EXTENSIONS:**
```javascript
const ASSET_EXTENSIONS = ['css', 'js', 'woff', 'woff2', 'ttf', 'otf', 'eot', 'ico'];
```
**Purpose:** Extensions that should be proxied as assets (not images).

**EXCLUDED_DOMAINS:**
```javascript
const EXCLUDED_DOMAINS = [
  'www.google-analytics.com',
  'www.googletagmanager.com',
  // ... analytics and tracking domains
];
```
**Purpose:** Domains to never process (analytics, tracking pixels, etc.).

---

### Section 4: Worker Entry Point (Lines 162-170)

```javascript
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  }
};
```

**Purpose:** Standard Cloudflare Workers entry point.

**Parameters:**
- `request`: The incoming HTTP request
- `env`: Environment variables
- `ctx`: Execution context (for async operations)

---

### Section 5: Main Request Handler (Lines 172-231)

**Flow:**

1. **Get Configuration** (line 181)
   ```javascript
   const config = getConfig(env, request);
   ```
   - Reads environment variables
   - Applies defaults
   - Auto-detects domain if needed

2. **Validate Configuration** (line 184)
   ```javascript
   validateConfig(config);
   ```
   - Checks for invalid values
   - Validates domain format
   - Fixes NaN issues

3. **Handle CORS Preflight** (lines 188-190)
   ```javascript
   if (request.method === 'OPTIONS' && ...) {
     return handleCorsPreflight();
   }
   ```
   - Handles CORS preflight requests for proxy endpoints
   - Required for cross-origin asset loading

4. **Route to Proxy Handlers** (lines 193-206)
   - `/img-cache/` → `handleAvifProxy()`
   - `/img-original/` → `handleOriginalImageProxy()`
   - `/asset-cache/` → `handleAssetProxy()`

5. **Fetch HTML with Caching** (lines 208-215)
   ```javascript
   const response = await fetch(request, {
     cf: {
       cacheEverything: true,
       cacheTtl: config.EDGE_CACHE_TTL,
     }
   });
   ```
   - Fetches HTML from origin
   - Enables Cloudflare edge caching
   - Sets 1-year TTL

6. **Transform HTML** (lines 217-224)
   - Only processes HTML responses
   - Calls `transformHtmlResponse()` to rewrite URLs

7. **Error Handling** (lines 226-230)
   - Fail-open strategy
   - Returns original request on error
   - Logs errors for debugging

---

### Section 6: Configuration Management (Lines 233-319)

#### `getConfig(env, request)` (Lines 238-261)

**Purpose:** Parse environment variables and build configuration object.

**Process:**
1. Get domain from env var or auto-detect from request URL
2. Parse integer values (quality, TTLs) with `parseInt(..., 10)`
3. Validate image format (must be 'auto', 'webp', or 'avif')
4. Parse OG image settings (format, quality)
5. Return configuration object

**Key Features:**
- Auto-detection of domain
- Radix 10 for parseInt (prevents octal parsing)
- Format validation
- Normalizes 'jpg' to 'jpeg' for OG images

#### `validateConfig(config)` (Lines 266-319)

**Purpose:** Validate all configuration values and fix invalid ones.

**Validations:**
1. **IMAGE_QUALITY:** Must be 1-100, not NaN
2. **EDGE_CACHE_TTL:** Must be ≥ 0, not NaN
3. **BROWSER_CACHE_TTL:** Must be ≥ 0, not NaN
4. **OG_IMAGE_QUALITY:** Must be 1-100, not NaN
5. **DOMAIN:** Must be non-empty string
6. **DOMAIN FORMAT:** Basic format validation (regex)

**Behavior:**
- Warns on invalid values
- Falls back to defaults
- Throws error only for critical issues (missing domain)

---

### Section 7: HTML Transformation (Lines 321-980)

#### `transformHtmlResponse(response, config)` (Lines 328-346)

**Purpose:** Main entry point for HTML transformation.

**Process:**
1. Convert response to text
2. Quick check: Does HTML contain Webflow assets? (early exit if not)
3. Build domain info for self-reference checks
4. Transform image URLs
5. Transform asset URLs
6. Return transformed HTML as new Response

**Optimization:** Early exit if no Webflow assets found (saves processing time).

#### `hasWebflowAssets(html, config)` (Lines 352-371)

**Purpose:** Quick check if HTML contains Webflow CDN assets.

**Process:**
1. Early exit if HTML < 100 bytes
2. Check for Webflow CDN domains in HTML
3. If catch-all mode, check for any external asset URLs
4. Return boolean

**Optimization:** Avoids full regex processing if no assets present.

#### `buildDomainInfo(domain)` (Lines 376-397)

**Purpose:** Build domain comparison object for self-reference checks.

**Returns:**
```javascript
{
  original: 'www.milkmoonstudio.com',
  baseDomain: 'milkmoonstudio.com',
  withWww: 'www.milkmoonstudio.com',
  withoutWww: 'milkmoonstudio.com',
}
```

**Purpose:** Allows checking if a URL belongs to our domain (including subdomains).

#### `isOwnDomain(hostname, domainInfo)` (Lines 402-418)

**Purpose:** Check if hostname belongs to our domain.

**Checks:**
- Exact matches (with/without www)
- Subdomain matches (e.g., `cdn.example.com` for `example.com`)

**Why:** Prevents infinite loops (don't transform URLs that are already on our domain).

#### `isExcludedDomain(hostname)` (Lines 423-428)

**Purpose:** Check if hostname should be excluded from processing.

**Why:** Skip analytics, tracking pixels, etc.

#### `transformAllImageUrls(html, config, domainInfo)` (Lines 433-448)

**Purpose:** Transform all image URLs in HTML.

**Process:**
1. Transform `src` and `data-src` attributes
2. Transform `srcset` and `data-srcset` attributes
3. Transform inline `style` attributes
4. Transform `<style>` blocks

**Returns:** Transformed HTML string

#### `transformSrcAttributes(html, config, domainInfo)` (Lines 453-461)

**Purpose:** Transform `src` and `data-src` attributes on `<img>` and `<source>` elements.

**Regex Pattern:**
```javascript
/(<(?:img|source)\b[^>]*\s)((?:data-)?src\s*=\s*)(["'])([^"']*)\3/gi
```

**Matches:**
- `<img src="...">`
- `<img data-src="...">`
- `<source src="...">`
- `<source data-src="...">`

**Process:**
- Extracts URL from attribute
- Calls `transformSingleUrl()` to transform
- Replaces in HTML

#### `transformSrcsetAttributes(html, config, domainInfo)` (Lines 466-474)

**Purpose:** Transform `srcset` and `data-srcset` attributes.

**Regex Pattern:**
```javascript
/(<(?:img|source)\b[^>]*\s)((?:data-)?srcset\s*=\s*)(["'])([^"']*)\3/gi
```

**Process:**
- Extracts srcset value
- Calls `transformSrcsetValue()` to handle comma-separated URLs
- Replaces in HTML

#### `transformSrcsetValue(srcset, config, domainInfo)` (Lines 479-499)

**Purpose:** Transform a srcset attribute value (comma-separated URLs with descriptors).

**Example Input:**
```
image-500.jpg 500w, image-1000.jpg 1000w, image-2000.jpg 2x
```

**Process:**
1. Split by comma
2. For each entry:
   - Parse URL and descriptor (e.g., "2x" or "800w")
   - Transform URL
   - Reconstruct with descriptor
3. Filter empty entries
4. Join with commas

**Returns:** Transformed srcset string

#### `transformInlineStyles(html, config, domainInfo)` (Lines 504-512)

**Purpose:** Transform `url()` functions in inline `style` attributes.

**Regex Pattern:**
```javascript
/(\bstyle\s*=\s*)(["'])([^"']*)\2/gi
```

**Example:**
```html
<div style="background-image: url(https://cdn.prod.website-files.com/bg.jpg)">
```

**Process:**
- Extracts style content
- Calls `transformCssUrls()` to transform `url()` functions
- Replaces in HTML

#### `transformStyleBlocks(html, config, domainInfo)` (Lines 517-525)

**Purpose:** Transform `url()` functions in `<style>` blocks.

**Regex Pattern:**
```javascript
/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi
```

**Process:**
- Extracts CSS content from `<style>` tags
- Calls `transformCssUrls()` to transform `url()` functions
- Replaces in HTML

#### `transformCssUrls(css, config, domainInfo)` (Lines 530-540)

**Purpose:** Transform `url()` values in CSS content.

**Regex Pattern:**
```javascript
/url\(\s*(["']?)([^"')]+)\1\s*\)/gi
```

**Matches:**
- `url('https://...')`
- `url("https://...")`
- `url(https://...)`

**Process:**
- Extracts URL from `url()` function
- Transforms URL
- Preserves original quote style
- Replaces in CSS

#### `transformSingleUrl(url, config, domainInfo)` (Lines 545-623)

**Purpose:** Transform a single image URL to use Cloudflare optimization.

**Process:**

1. **Skip Empty/Invalid URLs** (lines 547-553)
   - Empty strings
   - Data URLs (`data:`)
   - Blob URLs (`blob:`)
   - Non-HTTP URLs (relative paths)

2. **Skip Already-Transformed URLs** (lines 555-559)
   - URLs containing `/cdn-cgi/image/`
   - URLs containing `/img-cache/`
   - URLs containing `/img-original/`
   - URLs containing `/asset-cache/`
   - **Why:** Prevents double-processing

3. **Parse URL** (lines 561-567)
   - Use `new URL()` to parse
   - Handle invalid URLs gracefully

4. **Domain Checks** (lines 569-577)
   - Skip own domain (prevents loops)
   - Skip excluded domains (analytics, etc.)

5. **Webflow Origin Check** (lines 579-587)
   - Check if from Webflow CDN
   - Skip if not Webflow and not catch-all mode

6. **Get Extension** (lines 589-593)
   - Extract file extension
   - Return unchanged if no extension

7. **AVIF Handling** (lines 595-601)
   - If AVIF: Proxy via `/img-cache/`
   - No transformation (already optimal)

8. **Transformable Images** (lines 603-621)
   - Proxy original via `/img-original/`
   - Build transform URL with Cloudflare Image Resizing
   - Handle SVG specially (no quality parameter)
   - Return transformed URL

**Returns:** Transformed URL or original if unchanged

#### `transformAllAssetUrls(html, config, domainInfo)` (Lines 628-637)

**Purpose:** Transform all asset URLs (CSS, JS, fonts, icons).

**Process:**
1. Transform `<link>` tags
2. Transform `<script>` tags
3. Transform `<meta>` tags (OG/Twitter images)

#### `transformLinkTags(html, config, domainInfo)` (Lines 642-660)

**Purpose:** Transform `<link>` tags (CSS, favicons, etc.).

**Regex Pattern:**
```javascript
/<link\b([^>]*)>/gi
```

**Process:**
1. Extract `href` attribute
2. Check if favicon/apple-touch-icon:
   - If yes: Transform as image (use `transformSingleUrl()`)
   - If no: Transform as asset (use `transformAssetUrl()`)
3. Replace in HTML

**Why Separate Handling:** Favicons are images and should be optimized, not just proxied.

#### `transformScriptTags(html, config, domainInfo)` (Lines 665-675)

**Purpose:** Transform `<script>` tags.

**Regex Pattern:**
```javascript
/<script\b([^>]*)>/gi
```

**Process:**
1. Extract `src` attribute
2. Transform as asset (use `transformAssetUrl()`)
3. Replace in HTML

#### `transformMetaTags(html, config, domainInfo)` (Lines 680-700)

**Purpose:** Transform `<meta>` tags (OG/Twitter images).

**Regex Pattern:**
```javascript
/<meta\b([^>]*)>/gi
```

**Process:**
1. Check if OG/Twitter image meta tag
2. Extract `content` attribute
3. Transform as OG image (use `transformOgImageUrl()`)
4. Replace in HTML

#### `transformAssetUrl(url, config, domainInfo)` (Lines 708-728)

**Purpose:** Transform a single asset URL to use proxy.

**Process:** Similar to `transformSingleUrl()`, but:
- Checks if extension is in `ASSET_EXTENSIONS`
- Proxies via `/asset-cache/` instead of transforming
- No image optimization applied

#### `transformOgImageUrl(url, config, domainInfo)` (Lines 738-820)

**Purpose:** Transform OG/Twitter image URL with OG-specific settings.

**Process:** Similar to `transformSingleUrl()`, but:
- Uses `OG_IMAGE_FORMAT` (default: 'jpeg')
- Uses `OG_IMAGE_QUALITY` (default: 80)
- Converts AVIF to OG format (AVIF not well supported for social media)

**Key Difference:** OG images get JPEG format by default for better social media compatibility.

#### `validateAssetContentType(contentType, ext)` (Lines 749-772)

**Purpose:** Validate that content type matches expected type for asset extension.

**Process:**
1. Normalize content type (remove charset, etc.)
2. Look up expected types for extension
3. Check if content type matches
4. Return true if valid or unknown

**Why:** Catches misconfigured origins (e.g., HTML returned for font file).

#### `safeEncodeUrl(url)` (Lines 777-797)

**Purpose:** Safely encode URL, avoiding double-encoding.

**Process:**
1. Try to decode URL
2. If decode works and result differs: Already encoded, decode then re-encode
3. If decode fails: Not encoded, encode it
4. Return normalized encoded URL

**Why:** Prevents double-encoding issues (e.g., `%20` becoming `%2520`).

#### `getExtension(pathname)` (Lines 817-838)

**Purpose:** Extract file extension from URL pathname.

**Process:**
1. Remove query string and hash
2. Get filename from path
3. Extract extension (last part after dot)
4. Validate: 1-5 alphanumeric characters
5. Return lowercase extension

**Why:** Determines how to handle the file (transform vs proxy).

#### `createResponse(html, originalResponse)` (Lines 968-980)

**Purpose:** Create a new Response with transformed HTML.

**Process:**
1. Clone headers from original response
2. Set Content-Type to `text/html; charset=utf-8`
3. Create new Response with transformed HTML
4. Preserve status code and status text

---

### Section 8: Proxy Handlers (Lines 982-1345)

#### `handleAvifProxy(url, config, ctx)` (Lines 998-977)

**Purpose:** Proxy and cache AVIF images.

**Process:**

1. **Extract Original URL** (lines 1000-1017)
   - Extract encoded URL from path
   - Decode URL
   - Validate URL scheme

2. **Security Validation** (lines 1019-1033)
   - Validate origin if not catch-all mode
   - Check against `WEBFLOW_ORIGINS`
   - Return 403 if not allowed

3. **Cache Check** (lines 1035-1056)
   - Try to get from Cache API
   - Return cached response if found (with `X-Cache: HIT`)

4. **Fetch from Origin** (lines 1058-1074)
   - Fetch AVIF from Webflow CDN
   - Enable edge caching (`cf.cacheEverything`)
   - Set 1-year TTL

5. **Validate Response** (lines 1076-1082)
   - Check response status
   - Verify Content-Type is image

6. **Build Response Headers** (lines 1084-1102)
   - Set Content-Type
   - Set Cache-Control (1 year edge, 1 week browser)
   - Set CORS headers
   - Preserve Content-Length

7. **Cache Response** (lines 1104-1114)
   - Store in Cache API asynchronously
   - Use `ctx.waitUntil()` for non-blocking

**Returns:** Proxied AVIF image with caching headers

#### `handleAssetProxy(url, config, ctx)` (Lines 1147-1256)

**Purpose:** Proxy and cache assets (CSS, JS, fonts, icons).

**Process:** Similar to `handleAvifProxy()`, but:

1. **Content-Type Inference** (lines 1205-1232)
   - If origin doesn't provide Content-Type, infer from extension
   - Maps extensions to MIME types

2. **HTML Guard** (lines 1234-1237)
   - Rejects HTML responses for binary assets (fonts)
   - Prevents caching error pages as assets

3. **Content-Type Validation** (lines 1239-1245)
   - Validates content type matches expected type
   - Warns on mismatches (doesn't reject)

**Key Features:**
- Handles all asset types (CSS, JS, fonts, icons)
- Validates content types
- Prevents HTML-as-asset caching

#### `handleOriginalImageProxy(url, config, ctx)` (Lines 1258-1345)

**Purpose:** Proxy original images for Cloudflare Image Resizing.

**Process:** Similar to other proxies, but:

1. **No Manual Cache API** (lines 1270-1280)
   - Uses only `cf.cacheEverything`
   - No manual Cache API calls
   - **Why:** Image transformer handles its own caching

2. **Content-Length Preservation** (lines 1290-1297)
   - Preserves Content-Length from origin
   - Warns if missing (affects Cache Reserve eligibility)
   - **Note:** Cache Reserve not available with O2O anyway

**Key Features:**
- Optimized for Image Resizing service
- Minimal overhead
- Proper caching headers

#### `handleCorsPreflight()` (Lines 1176-1186)

**Purpose:** Handle CORS preflight requests.

**Returns:** 204 No Content with CORS headers

**Why:** Required for cross-origin asset loading from browsers.

#### `errorResponse(status, message)` (Lines 1169-1177)

**Purpose:** Create standardized error responses.

**Features:**
- Plain text content type
- No-cache headers
- Proper status codes

---

## Troubleshooting & FAQ

### Images Not Loading

**Symptom:** Images return 404 or don't load.

**Check:**
1. Is Image Transformations enabled?
2. Is your domain added to Allowed Origins?
3. Check browser console for errors
4. Verify Worker route is active

**Solution:**
- Enable Image Transformations
- Add your domain to Allowed Origins
- Check Worker logs in Cloudflare Dashboard

### Assets Not Being Proxied

**Symptom:** CSS/JS still loading from Webflow CDN.

**Check:**
1. Is Worker deployed on custom domain route?
2. Is route pattern correct? (`*yourdomain.com/*`)
3. Check HTML source - are URLs transformed?

**Solution:**
- Verify route is active
- Check route pattern matches your domain
- Clear browser cache and reload

### OG Images Not Optimized

**Symptom:** OG images still using original URLs.

**Check:**
1. Are meta tags being transformed? (View source)
2. Is `OG_IMAGE_FORMAT` set correctly?

**Solution:**
- Check HTML source for transformed OG image URLs
- Verify `OG_IMAGE_FORMAT` variable is set (defaults to 'jpeg')

### Performance Issues

**Symptom:** Site feels slow.

**Check:**
1. Worker CPU time (should be < 5ms)
2. Cache hit rate (check `X-Cache` headers)
3. Network latency

**Solution:**
- Check Worker logs for errors
- Verify caching is working (`X-Cache: HIT`)
- Most performance issues are network-related, not Worker-related

### Double-Encoding Issues

**Symptom:** URLs have `%2520` instead of `%20`.

**Check:**
- Is `safeEncodeUrl()` being used?

**Solution:**
- Should be fixed in v4.3
- If still happening, check URL transformation logic

---

## Performance Notes

### Current Implementation: Regex-Based

**Approach:** 7 regex passes on HTML string

**Performance:**
- Small pages (50KB): ~1-2ms
- Medium pages (100KB): ~2-5ms
- Large pages (200KB): ~5-10ms

**Why This is Acceptable:**
- Performance impact is minimal (< 1% of total page load time)
- Code is simple and maintainable
- Works reliably for all use cases
- No CSS chunking issues (Webflow uses external CSS files)

**When to Optimize:**
- If pages regularly exceed 200KB
- If Worker CPU time becomes a concern
- If you need streaming benefits

**Future Optimization:**
- HTMLRewriter for element/attribute transformations
- Keep regex for CSS `url()` in style blocks (if needed)
- Hybrid approach for best of both worlds

---

## Security Considerations

### Origin Validation

The script validates origins before proxying:
- Only Webflow CDN domains allowed (unless `CATCH_ALL_EXTERNAL=true`)
- Prevents open proxy abuse
- Validates URL schemes

### Content-Type Validation

- Validates content types for assets
- Rejects HTML responses for binary assets (fonts)
- Prevents caching error pages as assets

### CORS Headers

- Sets proper CORS headers for cross-origin usage
- Allows all origins (`*`) - adjust if needed for security

---

## Best Practices

### Caching Strategy

- **Edge Cache:** 1 year (maximum performance)
- **Browser Cache:** 1 week (balance between performance and updates)
- **Adjust if needed:** Change `EDGE_CACHE_TTL` and `BROWSER_CACHE_TTL`

### Image Quality

- **Regular Images:** 85% (good balance)
- **OG Images:** 80% (faster loading for social media)
- **Adjust if needed:** Change `IMAGE_QUALITY` and `OG_IMAGE_QUALITY`

### Format Selection

- **Regular Images:** `auto` (best browser support)
- **OG Images:** `jpeg` (best social media compatibility)
- **Adjust if needed:** Change `IMAGE_FORMAT` and `OG_IMAGE_FORMAT`

---

## Limitations

### Known Limitations

1. **Cache Reserve:** Not available with O2O proxying (Cloudflare limitation)
2. **JSON-LD:** URLs in structured data not transformed (acceptable - search engines handle originals)
3. **Regex Approach:** Multiple passes (acceptable performance for typical pages)

### What Doesn't Work

- Assets from non-Webflow CDN domains (unless `CATCH_ALL_EXTERNAL=true`)
- Data URLs (`data:image/...`)
- Blob URLs (`blob:...`)
- Relative URLs (not HTTP/HTTPS)

---

## Conclusion

This Cloudflare Worker provides a comprehensive solution for optimizing and proxying all Webflow CDN assets through your domain. It enables Cloudflare's Image Resizing, edge caching, and CORS-free delivery while maintaining compatibility with any Webflow site.

The regex-based approach provides excellent performance for typical page sizes while keeping the code simple and maintainable. For larger pages or specific performance requirements, a hybrid HTMLRewriter approach could be considered in the future.

**Key Benefits:**
- ✅ Automatic image optimization (AVIF/WebP)
- ✅ Edge caching for all assets
- ✅ CORS-free delivery
- ✅ Social media optimization
- ✅ Works on any Webflow site
- ✅ Production-ready and tested

**Setup Time:** ~15 minutes  
**Maintenance:** Minimal (set and forget)  
**Performance Impact:** < 5ms (negligible)

---

## Complete Code Walkthrough (Detailed)

### Overview

The script is ~1,450 lines and organized into 9 main sections. Let's walk through each section in detail.

---

### Section 1: Header Documentation (Lines 1-110)

**Purpose:** Comprehensive inline documentation.

**Contents:**
- What the script does (5 main functions)
- Configuration variables (required and optional)
- Prerequisites (Image Transformations, Allowed Origins, Custom Domain)
- How it works (request flow, caching strategy)
- Cache Reserve notes (O2O limitation)

**Why Important:** This is the first thing developers see. It explains everything without reading code.

---

### Section 2: Default Configuration (Lines 112-131)

```javascript
const DEFAULT_CONFIG = {
  IMAGE_FORMAT: 'auto',           // Browser-optimized format selection
  IMAGE_QUALITY: 85,              // Good quality/size balance
  OG_IMAGE_FORMAT: 'jpeg',        // Social media compatibility
  OG_IMAGE_QUALITY: 80,            // Faster loading for social
  EDGE_CACHE_TTL: 31536000,       // 1 year = 31,536,000 seconds
  BROWSER_CACHE_TTL: 604800,      // 1 week = 604,800 seconds
  CATCH_ALL_EXTERNAL: false,      // Security: only Webflow CDN by default
};
```

**Purpose:** Fallback values when environment variables aren't set.

**Design Decision:** Sensible defaults mean the script works out-of-the-box, but can be customized.

---

### Section 3: Constants (Lines 133-160)

#### WEBFLOW_ORIGINS
```javascript
const WEBFLOW_ORIGINS = [
  'assets.website-files.com',
  'assets-global.website-files.com',
  'cdn.prod.website-files.com',
  'uploads-ssl.webflow.com',
];
```
**Purpose:** Whitelist of Webflow CDN domains to process.

**Why Array:** Easy to extend if Webflow adds new CDN domains.

#### TRANSFORMABLE_EXTENSIONS
```javascript
const TRANSFORMABLE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
```
**Purpose:** Extensions that Cloudflare Image Resizing can transform.

**Note:** SVG is included - Cloudflare sanitizes but doesn't rasterize (preserves vector nature).

#### PASSTHROUGH_EXTENSIONS
```javascript
const PASSTHROUGH_EXTENSIONS = ['avif'];
```
**Purpose:** Extensions that should be proxied only (no transformation).

**Why:** AVIF is already the optimal format - no need to re-encode.

#### ASSET_EXTENSIONS
```javascript
const ASSET_EXTENSIONS = ['css', 'js', 'woff', 'woff2', 'ttf', 'otf', 'eot', 'ico'];
```
**Purpose:** Extensions that should be proxied as assets (not images).

**Why Separate:** Assets don't need image transformation, just proxying and caching.

#### EXCLUDED_DOMAINS
```javascript
const EXCLUDED_DOMAINS = [
  'www.google-analytics.com',
  'www.googletagmanager.com',
  // ... analytics and tracking domains
];
```
**Purpose:** Domains to never process.

**Why:** Analytics pixels, tracking scripts, etc. should not be proxied.

---

### Section 4: Worker Entry Point (Lines 162-170)

```javascript
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  }
};
```

**Purpose:** Standard Cloudflare Workers entry point.

**Parameters:**
- `request`: Incoming HTTP request (Request object)
- `env`: Environment variables (object)
- `ctx`: Execution context (for async operations like `ctx.waitUntil()`)

**Why Export Default:** Cloudflare Workers expects this format.

---

### Section 5: Main Request Handler (Lines 172-231)

This is the core routing logic. Let's break it down:

#### Step 1: Get Configuration (Line 181)
```javascript
const config = getConfig(env, request);
```
- Reads environment variables
- Applies defaults
- Auto-detects domain if needed
- Returns configuration object

#### Step 2: Validate Configuration (Line 184)
```javascript
validateConfig(config);
```
- Checks for invalid values (NaN, out of range, etc.)
- Fixes invalid values (warns and uses defaults)
- Throws error only for critical issues (missing domain)

#### Step 3: Parse Request URL (Line 186)
```javascript
const url = new URL(request.url);
```
- Parses request URL
- Used for routing decisions

#### Step 4: Handle CORS Preflight (Lines 188-190)
```javascript
if (request.method === 'OPTIONS' && ...) {
  return handleCorsPreflight();
}
```
- Handles CORS preflight requests
- Required for cross-origin asset loading
- Returns 204 No Content with CORS headers

#### Step 5: Route to Proxy Handlers (Lines 193-206)

**AVIF Proxy** (`/img-cache/`):
```javascript
if (url.pathname.startsWith('/img-cache/')) {
  return handleAvifProxy(url, config, ctx);
}
```
- Handles AVIF image requests
- Proxies from Webflow CDN
- Caches at edge

**Original Image Proxy** (`/img-original/`):
```javascript
if (url.pathname.startsWith('/img-original/')) {
  return handleOriginalImageProxy(url, config, ctx);
}
```
- Handles original image requests (for Image Resizing)
- Proxies from Webflow CDN
- Caches at edge

**Asset Proxy** (`/asset-cache/`):
```javascript
if (url.pathname.startsWith('/asset-cache/')) {
  return handleAssetProxy(url, config, ctx);
}
```
- Handles CSS, JS, font, icon requests
- Proxies from Webflow CDN
- Caches at edge

#### Step 6: Fetch HTML with Caching (Lines 208-215)
```javascript
const response = await fetch(request, {
  cf: {
    cacheEverything: true,
    cacheTtl: config.EDGE_CACHE_TTL,
  }
});
```
- Fetches HTML from origin (Webflow)
- Enables Cloudflare edge caching
- Sets 1-year TTL
- **Why:** HTML responses are cached, reducing origin load

#### Step 7: Transform HTML (Lines 217-224)
```javascript
if (!contentType.includes('text/html')) {
  return response;  // Skip non-HTML
}
return transformHtmlResponse(response, config);
```
- Only processes HTML responses
- Skips images, CSS, etc. (they're handled by proxy endpoints)
- Transforms URLs in HTML

#### Step 8: Error Handling (Lines 226-230)
```javascript
catch (error) {
  console.error('Worker error:', error.message, error.stack);
  return fetch(request);  // Fail open
}
```
- **Fail-open strategy:** On error, return original request
- Prevents breaking the site if Worker has issues
- Logs errors for debugging

---

### Section 6: Configuration Management (Lines 233-319)

#### `getConfig(env, request)` - Detailed

**Line 239:** Parse request URL for domain detection
```javascript
const url = new URL(request.url);
```

**Line 242:** Get domain from env or auto-detect
```javascript
const domain = env.DOMAIN || url.hostname;
```
- Uses environment variable if set
- Falls back to request hostname
- **Why:** Allows flexibility (can set explicitly or auto-detect)

**Lines 244-252:** Parse integer values
```javascript
const imageQuality = parseInt(env.IMAGE_QUALITY || DEFAULT_CONFIG.IMAGE_QUALITY, 10);
const edgeCacheTtl = parseInt(env.EDGE_CACHE_TTL || DEFAULT_CONFIG.EDGE_CACHE_TTL, 10);
const browserCacheTtl = parseInt(env.BROWSER_CACHE_TTL || DEFAULT_CONFIG.BROWSER_CACHE_TTL, 10);
```
- Uses `parseInt(..., 10)` with radix 10
- **Why:** Prevents octal parsing (e.g., `parseInt('08')` would be 0 without radix)
- Falls back to defaults if not set

**Line 253:** Parse boolean
```javascript
const catchAllExternal = env.CATCH_ALL_EXTERNAL === 'true' || DEFAULT_CONFIG.CATCH_ALL_EXTERNAL;
```
- Checks for exact string `'true'`
- Falls back to default if not set
- **Why:** Environment variables are strings, need explicit comparison

**Lines 256-258:** Validate image format
```javascript
const imageFormat = env.IMAGE_FORMAT || DEFAULT_CONFIG.IMAGE_FORMAT;
const validFormats = ['auto', 'webp', 'avif'];
const finalImageFormat = validFormats.includes(imageFormat) ? imageFormat : DEFAULT_CONFIG.IMAGE_FORMAT;
```
- Validates against allowed formats
- Falls back to default if invalid
- **Why:** Prevents invalid format values

**Lines 262-268:** Parse OG image settings
```javascript
const ogImageQuality = parseInt(env.OG_IMAGE_QUALITY || DEFAULT_CONFIG.OG_IMAGE_QUALITY, 10);
const ogImageFormat = (env.OG_IMAGE_FORMAT || DEFAULT_CONFIG.OG_IMAGE_FORMAT).toLowerCase();
const validOgFormats = ['jpeg', 'jpg', 'png', 'webp'];
const finalOgImageFormat = validOgFormats.includes(ogImageFormat) 
  ? (ogImageFormat === 'jpg' ? 'jpeg' : ogImageFormat)
  : DEFAULT_CONFIG.OG_IMAGE_FORMAT;
```
- Normalizes 'jpg' to 'jpeg' (Cloudflare uses 'jpeg')
- Validates format
- Falls back to default if invalid

**Lines 270-277:** Return configuration object
```javascript
return {
  DOMAIN: domain,
  IMAGE_FORMAT: finalImageFormat,
  IMAGE_QUALITY: imageQuality,
  OG_IMAGE_FORMAT: finalOgImageFormat,
  OG_IMAGE_QUALITY: ogImageQuality,
  EDGE_CACHE_TTL: edgeCacheTtl,
  BROWSER_CACHE_TTL: browserCacheTtl,
  CATCH_ALL_EXTERNAL: catchAllExternal,
};
```

#### `validateConfig(config)` - Detailed

**Lines 275-278:** Validate IMAGE_QUALITY
```javascript
if (isNaN(config.IMAGE_QUALITY) || config.IMAGE_QUALITY < 1 || config.IMAGE_QUALITY > 100) {
  console.warn(`Invalid IMAGE_QUALITY: ${config.IMAGE_QUALITY}, using default: ${DEFAULT_CONFIG.IMAGE_QUALITY}`);
  config.IMAGE_QUALITY = DEFAULT_CONFIG.IMAGE_QUALITY;
}
```
- Checks for NaN first (important!)
- Validates range (1-100)
- Warns and fixes (doesn't throw)

**Lines 281-289:** Validate cache TTLs
```javascript
if (isNaN(config.EDGE_CACHE_TTL) || config.EDGE_CACHE_TTL < 0) {
  console.warn(`Invalid EDGE_CACHE_TTL: ${config.EDGE_CACHE_TTL}, using default: ${DEFAULT_CONFIG.EDGE_CACHE_TTL}`);
  config.EDGE_CACHE_TTL = DEFAULT_CONFIG.EDGE_CACHE_TTL;
}
```
- Checks for NaN
- Validates non-negative
- Warns and fixes

**Lines 304-308:** Validate OG_IMAGE_QUALITY
```javascript
if (isNaN(config.OG_IMAGE_QUALITY) || config.OG_IMAGE_QUALITY < 1 || config.OG_IMAGE_QUALITY > 100) {
  console.warn(`Invalid OG_IMAGE_QUALITY: ${config.OG_IMAGE_QUALITY}, using default: ${DEFAULT_CONFIG.OG_IMAGE_QUALITY}`);
  config.OG_IMAGE_QUALITY = DEFAULT_CONFIG.OG_IMAGE_QUALITY;
}
```

**Lines 311-318:** Validate domain
```javascript
if (!config.DOMAIN || typeof config.DOMAIN !== 'string' || config.DOMAIN.trim() === '') {
  throw new Error('DOMAIN is required and must be a non-empty string');
}
```
- **Throws error** (not just warns)
- **Why:** Domain is critical - script can't work without it

**Lines 316-318:** Domain format validation
```javascript
if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i.test(config.DOMAIN)) {
  console.warn(`DOMAIN format may be invalid: ${config.DOMAIN}`);
}
```
- Basic format check (not comprehensive)
- Warns only (doesn't throw)
- **Why:** Some valid domains might not match, so we warn but don't block

---

### Section 7: HTML Transformation - Core Functions

#### `transformHtmlResponse(response, config)` (Lines 328-346)

**Line 329:** Convert response to text
```javascript
let html = await response.text();
```
- Loads entire HTML into memory
- **Note:** For very large pages, this could be optimized with streaming

**Lines 332-334:** Early exit optimization
```javascript
if (!hasWebflowAssets(html, config)) {
  return createResponse(html, response);
}
```
- Quick check before processing
- **Why:** Saves processing time if no Webflow assets present

**Line 337:** Build domain info
```javascript
const domainInfo = buildDomainInfo(config.DOMAIN);
```
- Builds domain comparison object
- Used to check if URLs belong to our domain

**Lines 340-343:** Transform URLs
```javascript
html = transformAllImageUrls(html, config, domainInfo);
html = transformAllAssetUrls(html, config, domainInfo);
```
- Transforms image URLs (7 regex passes)
- Transforms asset URLs (3 regex passes)
- Total: 10 regex passes (but optimized with early exit)

**Line 345:** Return transformed HTML
```javascript
return createResponse(html, response);
```

#### `hasWebflowAssets(html, config)` (Lines 352-371)

**Lines 354-356:** Early exit for small HTML
```javascript
if (html.length < 100) {
  return false;
}
```
- Very small HTML unlikely to have assets
- Saves regex processing

**Lines 359-363:** Check for Webflow CDN domains
```javascript
for (const origin of WEBFLOW_ORIGINS) {
  if (html.includes(origin)) {
    return true;
  }
}
```
- Simple string search (fast)
- Returns true if any Webflow CDN domain found

**Lines 366-368:** Catch-all mode check
```javascript
if (config.CATCH_ALL_EXTERNAL) {
  return /https?:\/\/[^"'\s<>]+\.(?:png|jpe?g|webp|gif|svg|avif|css|js|woff2?|ttf|otf|eot|ico)(?:[?#"'\s<>]|$)/i.test(html);
}
```
- Only runs if catch-all mode enabled
- Checks for any external asset URLs
- **Why:** More expensive, so only if needed

#### `buildDomainInfo(domain)` (Lines 376-397)

**Line 377:** Normalize domain
```javascript
const lower = domain.toLowerCase().trim();
```

**Lines 380-382:** Edge case: just "www"
```javascript
if (!lower || lower === 'www' || lower === 'www.') {
  throw new Error('Invalid domain: domain cannot be just "www"');
}
```

**Line 385:** Extract base domain
```javascript
const baseDomain = lower.replace(/^www\./, '');
```
- Removes 'www.' prefix
- Used for subdomain matching

**Lines 368-370:** Ensure base domain exists
```javascript
if (!baseDomain) {
  throw new Error('Invalid domain: base domain cannot be empty');
}
```

**Lines 372-377:** Return domain info object
```javascript
return {
  original: lower,              // 'www.milkmoonstudio.com'
  baseDomain: baseDomain,        // 'milkmoonstudio.com'
  withWww: 'www.' + baseDomain, // 'www.milkmoonstudio.com'
  withoutWww: baseDomain,        // 'milkmoonstudio.com'
};
```

#### `isOwnDomain(hostname, domainInfo)` (Lines 402-418)

**Purpose:** Check if hostname belongs to our domain.

**Lines 404-410:** Exact matches
```javascript
if (lower === domainInfo.original ||
    lower === domainInfo.withWww ||
    lower === domainInfo.withoutWww) {
  return true;
}
```

**Lines 413-415:** Subdomain check
```javascript
if (lower.endsWith('.' + domainInfo.baseDomain)) {
  return true;
}
```
- Matches subdomains (e.g., `cdn.example.com` for `example.com`)
- **Why:** Prevents transforming URLs that are already on our domain

#### `transformSingleUrl(url, config, domainInfo)` - Complete Flow

This is the core URL transformation function. Let's trace through it:

**Lines 546-548:** Skip empty
```javascript
if (!url || !url.trim()) {
  return url;
}
```

**Lines 551-553:** Skip data/blob URLs
```javascript
if (url.startsWith('data:') || url.startsWith('blob:')) {
  return url;
}
```
- Data URLs are inline (no transformation needed)
- Blob URLs are browser-generated (can't transform)

**Lines 556-558:** Skip non-HTTP URLs
```javascript
if (!url.startsWith('http://') && !url.startsWith('https://')) {
  return url;
}
```
- Relative URLs (e.g., `/images/photo.jpg`) are not transformed
- **Why:** They're already on our domain

**Lines 561-563:** Skip already-transformed URLs
```javascript
if (url.includes('/cdn-cgi/image/') || url.includes('/img-cache/') || url.includes('/img-original/') || url.includes('/asset-cache/')) {
  return url;
}
```
- **Critical:** Prevents infinite loops
- If URL already transformed, return as-is

**Lines 566-572:** Parse URL
```javascript
let parsed;
try {
  parsed = new URL(url);
} catch {
  return url;  // Invalid URL - return as-is
}
```
- Graceful error handling
- Invalid URLs returned unchanged

**Lines 577-579:** Skip own domain
```javascript
if (isOwnDomain(hostname, domainInfo)) {
  return url;
}
```

**Lines 582-584:** Skip excluded domains
```javascript
if (isExcludedDomain(hostname)) {
  return url;
}
```

**Lines 587-593:** Check Webflow origin
```javascript
const isWebflowOrigin = WEBFLOW_ORIGINS.some(origin =>
  hostname === origin || hostname.endsWith('.' + origin)
);

if (!isWebflowOrigin && !config.CATCH_ALL_EXTERNAL) {
  return url;
}
```

**Lines 597-600:** Get extension
```javascript
const ext = getExtension(parsed.pathname);
if (!ext) {
  return url;
}
```

**Lines 603-607:** AVIF handling
```javascript
if (PASSTHROUGH_EXTENSIONS.includes(ext)) {
  const encodedUrl = safeEncodeUrl(url);
  return 'https://' + config.DOMAIN + '/img-cache/' + encodedUrl;
}
```

**Lines 610-625:** Transformable images
```javascript
if (TRANSFORMABLE_EXTENSIONS.includes(ext)) {
  const encodedOriginalUrl = safeEncodeUrl(url);
  const originalProxyUrl = 'https://' + config.DOMAIN + '/img-original/' + encodedOriginalUrl;
  
  const isSvg = ext === 'svg';
  const quality = isNaN(config.IMAGE_QUALITY) ? DEFAULT_CONFIG.IMAGE_QUALITY : config.IMAGE_QUALITY;
  const transformParams = isSvg 
    ? 'format=' + config.IMAGE_FORMAT 
    : 'format=' + config.IMAGE_FORMAT + ',quality=' + quality;
  
  return 'https://' + config.DOMAIN + '/cdn-cgi/image/' + transformParams + '/' + originalProxyUrl;
}
```

**Key Points:**
- SVG: No quality parameter (Cloudflare ignores it)
- Other images: Include quality parameter
- Original URL is URL-encoded in the path

#### `transformOgImageUrl(url, config, domainInfo)` (Lines 738-820)

**Similar to `transformSingleUrl()`, but:**

**Lines 784-785:** Uses OG-specific settings
```javascript
const ogFormat = config.OG_IMAGE_FORMAT || DEFAULT_CONFIG.OG_IMAGE_FORMAT;
const ogQuality = isNaN(config.OG_IMAGE_QUALITY) ? DEFAULT_CONFIG.OG_IMAGE_QUALITY : config.OG_IMAGE_QUALITY;
```

**Lines 777-787:** AVIF conversion
```javascript
if (PASSTHROUGH_EXTENSIONS.includes(ext)) {
  // Convert AVIF to OG format (AVIF not well supported for social media)
  const encodedOriginalUrl = safeEncodeUrl(url);
  const originalProxyUrl = 'https://' + config.DOMAIN + '/img-original/' + encodedOriginalUrl;
  
  return 'https://' + config.DOMAIN + '/cdn-cgi/image/format=' + ogFormat + ',quality=' + ogQuality + '/' + originalProxyUrl;
}
```
- **Key Difference:** AVIF images are converted to OG format (JPEG default)
- **Why:** AVIF not well supported by social media platforms

---

### Section 8: Proxy Handlers - Detailed

#### `handleAvifProxy(url, config, ctx)` - Complete Flow

**Lines 1000-1004:** Extract URL
```javascript
const encodedUrl = url.pathname.slice('/img-cache/'.length);
if (!encodedUrl) {
  return errorResponse(400, 'Missing URL parameter');
}
```

**Lines 1007-1012:** Decode URL
```javascript
let originalUrl;
try {
  originalUrl = decodeURIComponent(encodedUrl);
} catch {
  return errorResponse(400, 'Invalid URL encoding');
}
```

**Lines 1015-1017:** Validate scheme
```javascript
if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
  return errorResponse(400, 'Invalid URL scheme');
}
```

**Lines 1019-1033:** Security validation
```javascript
if (!config.CATCH_ALL_EXTERNAL) {
  // Validate origin against WEBFLOW_ORIGINS
  // Return 403 if not allowed
}
```

**Lines 1035-1056:** Cache check
```javascript
try {
  cache = caches.default;
  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    // Return cached with X-Cache: HIT
  }
} catch (e) {
  // Cache API not available (e.g., on workers.dev)
  cache = null;
}
```

**Lines 1058-1074:** Fetch from origin
```javascript
originResponse = await fetch(originalUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; Cloudflare-Worker)',
    'Accept': 'image/avif,image/webp,image/*,*/*',
  },
  cf: {
    cacheEverything: true,
    cacheTtl: config.EDGE_CACHE_TTL,
  }
});
```

**Lines 1076-1082:** Validate response
```javascript
if (!originResponse.ok) {
  return errorResponse(originResponse.status, 'Origin returned error');
}

const contentType = originResponse.headers.get('Content-Type') || '';
if (!contentType || !contentType.startsWith('image/')) {
  return errorResponse(400, 'Response is not an image');
}
```

**Lines 1084-1102:** Build response headers
```javascript
const responseHeaders = new Headers();
responseHeaders.set('Content-Type', contentType);
responseHeaders.set('Cache-Control', 'public, s-maxage=' + config.EDGE_CACHE_TTL + ', max-age=' + config.BROWSER_CACHE_TTL + ', immutable');
responseHeaders.set('Access-Control-Allow-Origin', '*');
responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
responseHeaders.set('X-Cache', 'MISS');
```

**Lines 1104-1114:** Cache response
```javascript
if (cache && ctx && ctx.waitUntil) {
  ctx.waitUntil(
    cache.put(cacheKey, proxyResponse.clone()).catch(err => {
      console.error('Cache put error:', err.message);
    })
  );
}
```
- **Why `clone()`:** Response body can only be read once
- **Why `waitUntil()`:** Non-blocking cache write
- **Why error handling:** Cache failures shouldn't break the response

#### `handleAssetProxy(url, config, ctx)` - Key Differences

**Lines 1205-1232:** Content-Type inference
```javascript
if (!contentType) {
  // Infer from extension
  if (ext === 'css') contentType = 'text/css; charset=utf-8';
  else if (ext === 'js') contentType = 'application/javascript; charset=utf-8';
  // ... etc
}
```
- **Why:** Some origins don't provide Content-Type
- **Fallback:** Infer from file extension

**Lines 1234-1237:** HTML guard
```javascript
if (contentTypeLower.includes('text/html') && ext && ['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext)) {
  return errorResponse(502, 'Origin returned HTML instead of expected asset');
}
```
- **Why:** Prevents caching error pages as fonts
- **Only for fonts:** CSS/JS might legitimately be HTML (error pages)

**Lines 1239-1245:** Content-Type validation
```javascript
const isValid = validateAssetContentType(contentTypeLower, ext);
if (!isValid) {
  console.warn(`Content-Type mismatch: Expected ${ext}, got ${contentType}`);
  // Don't reject - some origins may serve with generic types
}
```
- **Warns but doesn't reject**
- **Why:** Some origins serve with generic types (e.g., `application/octet-stream`)

#### `handleOriginalImageProxy(url, config, ctx)` - Key Differences

**Lines 1270-1280:** No manual Cache API
```javascript
// Uses only cf.cacheEverything
// No manual Cache API calls
```
- **Why:** Image transformer handles its own caching
- **Simpler:** Less code, fewer edge cases

**Lines 1290-1297:** Content-Length preservation
```javascript
const contentLength = originResponse.headers.get('Content-Length');
if (contentLength) {
  responseHeaders.set('Content-Length', contentLength);
} else {
  console.warn('Missing Content-Length header');
}
```
- **Why:** Important for Cache Reserve (but not available with O2O anyway)
- **Warns but doesn't fail**

---

### Section 9: Utility Functions

#### `safeEncodeUrl(url)` (Lines 777-797)

**Purpose:** Prevent double-encoding.

**Process:**
1. Try to decode URL
2. If decode works and result differs: Already encoded → decode then re-encode
3. If decode fails: Not encoded → encode it
4. Return normalized encoded URL

**Example:**
```
Input: "https://example.com/image%20name.jpg"
Step 1: Try decode → "https://example.com/image name.jpg" (different)
Step 2: Re-encode → "https://example.com/image%20name.jpg" (normalized)
```

**Why Important:** Prevents `%20` becoming `%2520` (double-encoded).

#### `getExtension(pathname)` (Lines 817-838)

**Purpose:** Extract file extension from URL pathname.

**Process:**
1. Remove query string: `pathname.split('?')[0]`
2. Remove hash: `.split('#')[0]`
3. Get filename: `.split('/').pop()`
4. Extract extension: `.split('.').pop()`
5. Validate: 1-5 alphanumeric characters
6. Return lowercase

**Example:**
```
Input: "/path/to/image.jpg?version=1"
Step 1: Remove query → "/path/to/image.jpg"
Step 2: Get filename → "image.jpg"
Step 3: Get extension → "jpg"
Step 4: Validate → "jpg" (valid)
Step 5: Return → "jpg"
```

**Why Validation:** Prevents invalid extensions from causing issues.

#### `validateAssetContentType(contentType, ext)` (Lines 749-772)

**Purpose:** Validate content type matches expected type for extension.

**Process:**
1. Normalize content type (remove charset, etc.)
2. Look up expected types for extension
3. Check if content type matches
4. Return true if valid or unknown

**Example:**
```
Extension: "woff2"
Expected: ['font/woff2', 'application/font-woff2', 'application/octet-stream']
Content-Type: "font/woff2"
Result: true (matches)
```

**Why:** Catches misconfigured origins (e.g., HTML returned for font file).

---

## Code Quality & Best Practices

### Error Handling

**Fail-Open Strategy:**
- On error, return original request
- Prevents breaking the site
- Logs errors for debugging

**Graceful Degradation:**
- Invalid URLs returned unchanged
- Missing headers handled gracefully
- Cache failures don't break responses

### Performance Optimizations

**Early Exit:**
- `hasWebflowAssets()` checks before processing
- Saves regex processing if no assets

**Efficient Regex:**
- Specific patterns (not overly broad)
- Non-capturing groups where possible
- Global flag for multiple matches

**Caching:**
- HTML cached at edge
- Assets cached at edge
- Manual Cache API for AVIF/assets
- `cf.cacheEverything` for originals

### Security

**Origin Validation:**
- Only Webflow CDN domains allowed (unless catch-all)
- Prevents open proxy abuse

**Content-Type Validation:**
- Validates asset content types
- Rejects HTML for binary assets

**URL Validation:**
- Validates URL schemes
- Handles invalid URLs gracefully

### Maintainability

**Clear Function Names:**
- `transformSingleUrl()` - obvious purpose
- `handleAvifProxy()` - clear handler
- `isOwnDomain()` - self-documenting

**Comprehensive Comments:**
- Header documentation
- Function-level comments
- Inline comments for complex logic

**Constants:**
- All magic values in constants
- Easy to modify
- Self-documenting

---

## Summary

This Cloudflare Worker is a production-ready solution for optimizing and proxying Webflow CDN assets. It uses a regex-based approach that provides excellent performance for typical page sizes while maintaining code simplicity and reliability.

**Key Strengths:**
- ✅ Comprehensive URL transformation (all contexts)
- ✅ Proper error handling (fail-open)
- ✅ Security validation (origin checks)
- ✅ Performance optimizations (early exit, caching)
- ✅ Well-documented (inline and external)
- ✅ Production-tested (working on live site)

**Architecture:**
- Entry point routes requests
- Configuration management with validation
- HTML transformation via regex (7 passes for images, 3 for assets)
- Proxy handlers for AVIF, originals, and assets
- Utility functions for common operations

**Performance:**
- ~1-5ms for typical pages (50-200KB)
- Acceptable overhead (< 1% of total page load time)
- Caching reduces origin load significantly

