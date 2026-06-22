# Custom Domain SEO Hardening

## Overview

This document describes the SEO hardening implemented to ensure all traffic uses the custom domain `https://www.kiaskincare.com` and prevents Google from indexing the Vercel default domain.

**Custom Domain:** https://www.kiaskincare.com  
**Vercel Default Domain:** https://ozogroupwebsite.vercel.app

## Implementation

### 1. Environment Variable

Set the following environment variable in `.env.local` and production environment:

```bash
NEXT_PUBLIC_SITE_URL=https://www.kiaskincare.com
```

This variable is used throughout the application to generate canonical URLs, sitemaps, and metadata.

### 2. Middleware Redirect (middleware.ts)

**Permanent 301 redirect** from Vercel domains to custom domain:

```typescript
const officialUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.kiaskincare.com").replace(/\/$/, "");
const officialHost = new URL(officialUrl).hostname.toLowerCase();
const legacyHosts = (process.env.LEGACY_DOMAINS || "ozo-group.vercel.app,ozogroupwebsite.vercel.app")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

if (
  process.env.NODE_ENV === "production" &&
  hostname !== officialHost &&
  (hostname.endsWith(".vercel.app") || legacyHosts.includes(hostname))
) {
  return NextResponse.redirect(new URL(`${pathname}${req.nextUrl.search}`, officialUrl), 301);
}
```

**Behavior:**
- Any request to `*.vercel.app` redirects to `https://www.kiaskincare.com`
- Preserves pathname and querystring
- Uses 301 permanent redirect for SEO
- Only active in production

**Example:**
```
https://ozogroupwebsite.vercel.app/treatments
↓
https://www.kiaskincare.com/treatments
```

### 3. X-Robots-Tag for Non-Official Domains

Middleware adds `X-Robots-Tag: noindex, nofollow` for any non-official domain:

```typescript
if (hostname !== officialHost && process.env.NODE_ENV === "production") {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
}
```

This ensures Google never indexes pages served from Vercel domains.

### 4. MetadataBase (app/layout.tsx)

Root layout uses custom domain for metadataBase:

```typescript
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.kiaskincare.com").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // ...
};
```

This ensures all relative URLs in metadata resolve to the custom domain.

### 5. Sitemap (app/sitemap.ts)

Sitemap uses only the custom domain:

```typescript
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.kiaskincare.com").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      // ...
    },
    // ...
  ];
}
```

**Result:** All sitemap URLs are `https://www.kiaskincare.com/*`

### 6. Robots.txt (app/robots.ts)

Robots.txt references the custom domain sitemap:

```typescript
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.kiaskincare.com").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/partner/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
```

### 7. Open Graph URLs (app/layout.tsx)

Open Graph metadata uses custom domain:

```typescript
export const metadata: Metadata = {
  openGraph: {
    url: siteUrl,
    siteName: "KIA Skin Care",
    // ...
  },
};
```

### 8. Structured Data

The application does not currently use JSON-LD structured data. If added in the future, ensure all URLs use the custom domain via `NEXT_PUBLIC_SITE_URL`.

## Files Modified

- `middleware.ts` - Added 301 redirect and X-Robots-Tag
- `app/layout.tsx` - Updated siteUrl default to custom domain
- `app/sitemap.ts` - Updated siteUrl default to custom domain
- `app/robots.ts` - Updated siteUrl default to custom domain

## Testing

### 1. Test Redirect

Visit the Vercel default domain:
```
https://ozogroupwebsite.vercel.app/treatments
```

**Expected:** Redirects to `https://www.kiaskincare.com/treatments` with 301 status

### 2. Test Sitemap

Visit:
```
https://www.kiaskincare.com/sitemap.xml
```

**Expected:** All URLs are `https://www.kiaskincare.com/*` (no vercel.app URLs)

### 3. Test Canonical URLs

View page source of any page:
```
https://www.kiaskincare.com/treatments
```

**Expected:** Canonical URL is `https://www.kiaskincare.com/treatments`

### 4. Test X-Robots-Tag

Request Vercel domain with curl:
```bash
curl -I https://ozogroupwebsite.vercel.app/
```

**Expected:** Response includes `X-Robots-Tag: noindex, nofollow`

### 5. Build Verification

Run:
```bash
npm run build
```

**Expected:** Build completes successfully with no errors

## Environment Variables

### Required

```bash
NEXT_PUBLIC_SITE_URL=https://www.kiaskincare.com
```

### Optional (Legacy Domains)

```bash
LEGACY_DOMAINS=ozo-group.vercel.app,ozogroupwebsite.vercel.app
```

Additional legacy domains to redirect to the custom domain.

## SEO Impact

### Before Hardening

- Google could index both `ozogroupwebsite.vercel.app` and `kiaskincare.com`
- Duplicate content issues
- Split SEO authority
- Canonical confusion

### After Hardening

- Only `www.kiaskincare.com` is indexed
- No duplicate content
- Consolidated SEO authority
- Clear canonical signals
- Vercel domains permanently redirect

## Production Deployment

1. Set `NEXT_PUBLIC_SITE_URL=https://www.kiaskincare.com` in Vercel environment variables
2. Set `LEGACY_DOMAINS` if needed for additional legacy domains
3. Deploy to production
4. Verify redirect works by visiting Vercel domain
5. Submit new sitemap to Google Search Console
6. Monitor Google Search Console for crawl errors

## Notes

- Redirect uses 301 (permanent) for SEO best practices
- X-Robots-Tag provides backup protection in case redirect fails
- All metadata uses `NEXT_PUBLIC_SITE_URL` for consistency
- No UI changes required
- No Supabase changes required
