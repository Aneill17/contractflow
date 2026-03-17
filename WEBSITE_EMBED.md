# ContractFlow — Website Integration Guide

How to embed the ERS Housing Request form into eliasrangestays.ca.

---

## Option A: Iframe Embed ⭐ Recommended

Paste this into the **"Request a Quote"** section of the Workforce Housing page on your website builder (Wix, Squarespace, Webflow, or custom HTML):

```html
<iframe
  src="https://contractflow-omega.vercel.app/request"
  width="100%"
  height="960"
  frameborder="0"
  style="border-radius: 12px; max-width: 1000px; display: block; margin: 0 auto; box-shadow: 0 4px 32px rgba(0,0,0,0.10);"
  title="Request Workforce Housing — Elias Range Stays"
></iframe>
```

**Why this works:**
- The form is fully branded with ERS identity (logo, colours, mountain banners)
- Submissions go directly into the ContractFlow internal dashboard
- Vercel handles SSL — safe for any website embed
- Mobile responsive — adapts cleanly at any width
- No code changes needed on either side to receive new submissions

**Recommended height:** 960px. Adjust up if visitors report needing to scroll inside the iframe.

---

## Option B: Direct Link (Simplest)

Replace the existing "Request a Quote" button on eliasrangestays.ca with a direct link:

```
https://contractflow-omega.vercel.app/request
```

Opens in a new tab or same tab (both work). The page is fully branded — visitors won't feel like they've left the ERS experience.

**Button HTML example:**
```html
<a
  href="https://contractflow-omega.vercel.app/request"
  target="_blank"
  style="
    display: inline-block;
    background: #1B4353;
    color: white;
    font-family: 'League Spartan', sans-serif;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 16px 40px;
    border-radius: 8px;
    text-decoration: none;
  "
>
  Request a Quote →
</a>
```

---

## Option C: Custom Subdomain (Best Long-Term)

Point `housing.eliasrangestays.ca` to the Vercel deployment for the cleanest branded URL.

**Steps:**
1. In Vercel dashboard → ContractFlow project → Settings → Domains
2. Add `housing.eliasrangestays.ca`
3. At your DNS registrar (GoDaddy / Namecheap / Cloudflare), add:
   ```
   Type: CNAME
   Name: housing
   Value: cname.vercel-dns.com
   ```
4. Wait 5–30 minutes for DNS propagation
5. Update iframe src or button link to `https://housing.eliasrangestays.ca/request`

This makes the URL fully on-brand: `housing.eliasrangestays.ca/request`

---

## Current Live URL
`https://contractflow-omega.vercel.app/request`

## Support
austin@eliasrangestays.ca
