Render 404 Fix Pack

1) Add the `_redirects` file to your React app PUBLIC folder (public/_redirects) and commit.
   - Replace YOUR-BACKEND-SERVICE with your actual Render backend host.
   - This does two things:
       • Proxies /api/* to your backend service
       • Adds SPA fallback so React Router works on refresh

2) In your frontend repo root, create `.env` with:
   REACT_APP_API_URL=https://YOUR-BACKEND-SERVICE.onrender.com

3) Update your API calls to use this base:
   import { apiUrl } from './lib/api';
   axios.get(apiUrl('/api/health'));
   axios.post(apiUrl('/api/generate'), body);

4) Rebuild & redeploy the Static Site on Render.
