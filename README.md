# IA Skin Care · OZO Group

Premium skincare website + future referral platform.
**Tagline:** Glow Better. Earn Smarter.

## Tech
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

## Local Development

```bash
npm install
npm run dev
```

Then open: http://localhost:3000

## Logo
Drop your logo PNG at:
```
public/logos/ozo-group-logo.png
```
It is used in the header, footer, and as favicon.

## Project Structure
```
app/                Next.js App Router pages
components/         Reusable UI (Header, Footer, Logo, sections/)
lib/                Site config / helpers
types/              Shared TypeScript types
public/logos/       Brand assets
styles/             Global CSS (Tailwind)
```

## Design System
| Token   | Value     |
|---------|-----------|
| Primary | `#0D5C7D` |
| Accent  | `#1BA3C6` |
| Light   | `#5DA9D6` |
| Background | `#FFFFFF` |

Used as Tailwind classes: `text-brand-primary`, `bg-brand-accent`, `text-brand-light`, etc.

## Status
- [x] Step 1–6: Frontend foundation, header, footer, home page sections
- [ ] Auth & membership
- [ ] Dashboard
- [ ] Admin panel
- [ ] Supabase backend

---
Developed by [The Gujarati Designer](https://www.thegujaratidesigner.in)
