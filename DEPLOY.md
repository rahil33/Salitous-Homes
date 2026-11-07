# Deployment notes

## Long-lived asset caching

The files under `/assets/` are currently published with stable descriptive names. Before enabling immutable caching, add a content hash to filenames (or to the asset build pipeline) and update all references. Once asset URLs are content-addressed, configure the production web server/CDN to return:

```http
Cache-Control: public, max-age=31536000, immutable
```

Apply that policy to hashed files below `/assets/`. Do **not** apply it to `index.html`, route HTML, or unhashed files that may be replaced in place; serve those with revalidation (for example `Cache-Control: no-cache`). Ensure the host serves `.webp` with `image/webp`, `.mp4` with `video/mp4`, and `.wasm` with `application/wasm`.

The Vite `public/` directory is copied verbatim, so stable public asset paths do not receive automatic content hashes. Keep filenames versioned/content-addressed whenever their contents change, then retain old versions long enough for cached HTML to expire.

## WhatsApp auto-reply
Forms POST to `/api/inquiry` (`api/inquiry.js`, deploy on Vercel/Netlify). It sends the customer an approved WhatsApp template and notifies the team. Fill `.env.example` vars in your host. Without them the forms fall back to opening WhatsApp/email with details prefilled.
