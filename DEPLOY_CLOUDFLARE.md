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
