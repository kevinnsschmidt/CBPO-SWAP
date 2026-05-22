# CBPO Swap Board — Setup Guide

Follow these steps in order. Total time: ~30–45 minutes.

---

## STEP 1 — Supabase (database)

1. Go to https://supabase.com and create a free account
2. Click **New Project**, name it `cbpo-swap`, pick a region, set a strong DB password
3. Wait ~2 min for it to provision
4. Go to the **SQL Editor** tab in the left sidebar
5. Paste the entire contents of `schema.sql` and click **Run**
6. Go to **Project Settings → API**
7. Copy your **Project URL** and **anon/public key** — you'll need them next

---

## STEP 2 — Configure environment

1. In the project folder, copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
2. Open `.env` and paste your values:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

---

## STEP 3 — Add app icons

The PWA needs icons to install properly on phones.

1. Create a 512×512 PNG of your icon (a shield or badge image works well)
2. Save it as `public/icon-512.png`
3. Resize to 192×192 and save as `public/icon-192.png`
4. Resize to 180×180 and save as `public/apple-touch-icon.png`

**Quick option:** Use https://realfavicongenerator.net — upload one image and it generates all sizes.

---

## STEP 4 — Test locally

Make sure you have Node.js installed (https://nodejs.org — LTS version).

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173 in your browser. The app should load and connect to Supabase.

---

## STEP 5 — Deploy to Vercel

1. Push this project to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial deploy"
   # Create a new repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/cbpo-swap.git
   git push -u origin main
   ```

2. Go to https://vercel.com and sign in with GitHub
3. Click **Add New Project** → import your `cbpo-swap` repo
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` → your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
5. Click **Deploy**
6. Vercel gives you a URL like `cbpo-swap.vercel.app`

Every time you push to GitHub, Vercel auto-redeploys.

---

## STEP 6 — Install on your phone

**iPhone (iOS):**
1. Open the Vercel URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share** button (box with arrow)
3. Scroll down → tap **Add to Home Screen**
4. Name it "Swap Board" → tap **Add**
5. The app icon appears on your home screen

**Android:**
1. Open the URL in **Chrome**
2. Tap the **three dots** menu
3. Tap **Add to Home Screen** or **Install App**
4. Tap **Add**

---

## STEP 7 — Share with other officers

Send them the Vercel URL. They follow the same Step 6 to install it on their phones. No App Store needed.

---

## Maintenance notes

- **Supabase free tier:** 500MB storage, 2GB bandwidth/month — plenty for hundreds of officers
- **Expired locks:** Supabase automatically filters them by `expires_at`; no cleanup needed
- **To add a port:** Edit the `PORTS` array in `src/App.jsx` and redeploy
- **Costs:** Free on both Vercel and Supabase to start. Vercel Pro is $20/mo if you need custom domains or more bandwidth.

---

## Custom domain (optional)

If you want `cbposwap.com` or similar:
1. Buy a domain from Namecheap or Cloudflare (~$10/year)
2. In Vercel → your project → **Settings → Domains** → add it
3. Follow Vercel's DNS instructions (usually takes <1 hour to propagate)
