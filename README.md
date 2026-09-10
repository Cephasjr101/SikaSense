# SikaSense — AI Business Manager for Ghanaian SMEs (MVP)

A virtual employee for small businesses: the owner sends WhatsApp messages or voice notes —
"how much did i make yesterday?" — and the system answers. Complete, self-contained MVP.

## Run it
Open `index.html` in a browser — no build step, no dependencies, works offline.
A week of realistic demo data (sales, expenses, products, debtors, MoMo transactions)
is generated in `localStorage` on first load. Recording sales in the chat demo updates the dashboard live.

## What's inside (your requirements → where)

| Requirement | Where |
|---|---|
| WhatsApp-style chat + voice notes, **5 languages** | `demo.html` + `pages.js` — command parser (profit, record sale/expense, debts, stock, report, recon, tax, invoice, help) understanding **English, Twi, Ga, Ewe & Hausa** via keyword detection with localized, glossed labels (demo approach; production uses an LLM intent parser with human-reviewed locale files); real `MediaRecorder` voice notes with simulated transcription fallback |
| Record sales / track expenses | Chat: "sold 3 rice for 195", "spent 50 on data" → persisted, reflected on dashboard |
| Calculate profit | `data.js` `dayStats()` — per-day revenue, expenses, channel breakdown (MoMo/Cash/Bank) |
| Debt reminders | Debts tab with one-tap `wa.me` WhatsApp reminder links; chat command "remind debtors" |
| Generate invoices | `invoice.html` — itemized invoice builder, auto 15% VAT, print/PDF |
| Stock + finish prediction | `stockPredict()` — days-left = stock ÷ 7-day avg sales; critical (<3d) / low (<7d) badges + suggested reorder qty |
| Daily reports | Chat command "daily report" + dashboard KPIs |
| MoMo/bank reconciliation | `reconcile()` — matches MoMo references to recorded sales; flags "Missing settlement" / "No matching sale" + fee total |
| Tax/accounting reports | Tax tab: revenue, expenses, net profit, VAT 15%, income-tax estimate + print view |
| Privacy policy / Terms | `privacy.html`, `terms.html` (voice-note retention, debt-reminder consent, not-an-accountant clauses) |
| Secrets off the frontend | No secrets in the bundle; only the public GA ID. WhatsApp/Twilio/AI keys live server-side in env vars |
| Force HTTPS | `.htaccess` 301 redirect; Netlify/Vercel/nginx snippets below |
| Cookie consent banner | Footer partial; **analytics load only after acceptance** |
| Meta titles & descriptions | Unique per page |
| Social preview image | `assets/img/og-image.png` (1200×630) on OG + Twitter cards |
| Favicon | `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `site.webmanifest` |
| Sitemap / robots.txt | Included — replace `sikasense.example.com` with your domain |
| Alt text on images | Phone mockup has `aria-label`; decorative SVGs are `aria-hidden` |
| Page load speed | Zero frameworks/CDNs; deflate + long-cache headers in `.htaccess`; optimized PNGs |
| Color contrast | Text pairs ≥ 4.5:1 (`#111827` on white ≈ 15.8:1; white on `#116B4F` ≈ 5.4:1; `#92400E` on `#FDE68A` ≈ 4.6:1; `#128C4B` on `#E7F8EF` ≈ 4.8:1) |
| Mobile friendly | Responsive grids, hamburger nav, fluid type, touch-sized targets |
| Custom 404 | `404.html` (+ `ErrorDocument` in `.htaccess`) |
| Broken links | All internal links audited; sitemap lists only existing pages |
| Form validation | Inline `aria-invalid` errors, email/phone patterns, required checks (signup + invoice) |
| Spam protection | Honeypot + 2.5s time-trap + math CAPTCHA on the signup form |
| Analytics | GA4 loader gated by cookie consent; set ID in `main.js` (`ANALYTICS_ID`) |
| One clear CTA | Every page funnels to "Start free on WhatsApp" → `#signup` |

## Deploy (HTTPS)

**Netlify**: publish dir = repo root, build command empty (static). Force HTTPS: Settings → Domain → HTTPS.
**Vercel**: `{"cleanUrls": true}` — HTTPS is automatic.
**Nginx**:
```nginx
server { listen 80; server_name sikasense.example.com; return 301 https://$host$request_uri; }
```

## Going to production (same guidance as any bot MVP)
1. WhatsApp Business API (Meta or a BSP like Twilio/360dialog) — the demo's chat UI becomes the real channel.
2. Backend + database (Supabase recommended): auth, storage of sales/expenses, AI intent parsing (LLM call server-side — keep the API key in env vars).
3. Speech: Whisper or a Twi/Ga/Ewe-capable ASR for real voice transcription.
4. MoMo reconciliation: Hubtel/Paystack statement APIs instead of seeded data.
5. Replace `sikasense.example.com` + GA ID before launch.
