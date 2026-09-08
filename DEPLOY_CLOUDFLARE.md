# Deployment Guide

## 1. Cloudflare Workers (Backend)

The backend has been adapted for Cloudflare Workers in the `worker-backend/` directory.

### Prerequisites
- Cloudflare Account
- MongoDB Atlas Database (Get the connection string)
- Google Gemini API Key (or OpenAI Key)

### Deployment Steps
1. Navigate to the worker directory:
   ```bash
   cd worker-backend
   ```
2. Login to Cloudflare (if not already):
   ```bash
   npx wrangler login
   ```
3. Deploy:
   ```bash
   npm run deploy
   ```
   *Note: This will publish your worker. You will get a URL like `https://fitness-coach-backend.your-subdomain.workers.dev`.*

4. Set Secrets:
   Run the following commands to set your secrets securely:
   ```bash
   npx wrangler secret put MONGO_URI
   # Paste your MongoDB connection string when prompted
   
   npx wrangler secret put GEMINI_API_KEY
   # Paste your API key
   ```

   Optional — enables live YouTube search on the Motivation tab. Without it the
   app quietly falls back to its curated video library:
   ```bash
   npx wrangler secret put YOUTUBE_API_KEY
   ```

   Required before anyone can moderate the community feed. Without it the
   review-queue endpoints return 503 rather than being publicly writable:
   ```bash
   npx wrangler secret put ADMIN_KEY
   # then call the queue with:  -H "X-Admin-Key: <that value>"
   ```

5. Photo posts (optional — text threads work without this):
   R2 must be enabled once in the Cloudflare dashboard, then:
   ```bash
   npx wrangler r2 bucket create fitness-coach-media
   ```
   Then rename `"//r2_buckets"` to `"r2_buckets"` in `wrangler.json` and redeploy.
   Until that's done, uploads return 503 and the composer offers text posts only.

6. Check which AI backend is answering:
   ```bash
   curl https://<your-worker>.workers.dev/api/ai/health
   ```
   `usingFallback: true` means neither Workers AI nor Gemini responded, so the
   coach is serving canned advice — fix the binding or set `GEMINI_API_KEY`.

## 2. Cloudflare Pages (Frontend)

The frontend is in the `client/` directory.

### Deployment Steps
1. Push this entire repository to your GitHub account.
2. Go to the Cloudflare Dashboard > Pages > Connect to Git.
3. Select your repository.
4. Configure the build settings:
   - **Framework Preset:** Next.js
   - **Build Command:** `npx @cloudflare/next-on-pages`
   - **Output Directory:** `.vercel/output/static` (or default)
   
   *Actually, with `@cloudflare/next-on-pages`, the output directory is usually `.vercel/output/static` or just standard Next.js output. Use the "Next.js" preset.*

5. **Environment Variables:**
   Add the following variable in the Pages dashboard:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed Worker (e.g., `https://fitness-coach-backend.your-subdomain.workers.dev`)

6. Deploy!
