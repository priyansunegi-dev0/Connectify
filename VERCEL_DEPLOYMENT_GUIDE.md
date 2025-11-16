# Connectify Frontend - Vercel Deployment Checklist

## ✅ Completed Pre-Deployment Setup

### Configuration Files Created:
- [x] `vite.config.js` - Enhanced with production build optimizations
- [x] `vercel.json` - Vercel deployment configuration
- [x] `.vercelignore` - Files to ignore during deployment
- [x] `.env.development` - Development environment variables
- [x] `.env.production` - Production environment variables template

### Code Updates:
- [x] `src/pages/VideoMeet.jsx` - Updated to use environment-based server URL
- [x] Production build tested and verified - Output in `dist/` folder

### Build Output:
- ✓ 1025 modules transformed
- ✓ Total size: ~495 KB (vendor: 203 KB, app: 277 KB)
- ✓ Gzip compressed: ~162 KB total
- ✓ Built in 11.80 seconds

---

## 📋 Deployment Steps (To Be Done)

### Step 1: Initialize Git Repository
```powershell
cd C:\Users\negii\Downloads\Connectify-main\Connectify-main
git init
git add .
git commit -m "Initial commit: Connectify with Vite and Socket.IO rooms"
git remote add origin https://github.com/YOUR_USERNAME/Connectify.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your Connectify repository
5. **Configuration**:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. **Environment Variables** (Add before deploying):
   - `VITE_GEMINI_API_KEY`: Your Gemini API key
   - `VITE_SERVER_URL`: (Leave blank for now - update after backend deployment)
7. Click "Deploy"

### Step 3: Get Your Frontend URL
After deployment, Vercel will assign a URL like:
```
https://connectify-xxxxx.vercel.app
```
Save this URL - you'll need it for the backend CORS configuration.

### Step 4: Update Backend CORS (After Backend Deployment)
Once your backend is deployed, update the CORS in `backend/src/controllers/socketManager.js`:

```javascript
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://connectify-xxxxx.vercel.app"  // Your Vercel frontend URL
        ],
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});
```

### Step 5: Update Frontend Backend URL
After backend deployment, update the `VITE_SERVER_URL` environment variable in Vercel:

1. Go to Vercel dashboard → Your project
2. Settings → Environment Variables
3. Add/Update: `VITE_SERVER_URL=https://your-backend-url.onrender.com`
4. Redeploy from the dashboard

---

## 🔍 Verification Checklist

### Local Development Testing:
- [ ] Frontend loads on http://localhost:3001
- [ ] Can create and join meetings
- [ ] Socket.IO connects to backend
- [ ] Chat messages send and receive correctly
- [ ] WebRTC signaling works with second client

### Production Testing:
- [ ] Frontend loads on https://connectify-xxxxx.vercel.app
- [ ] Can create and join meetings
- [ ] Chat works with production backend
- [ ] Cross-device meeting join works
- [ ] No console errors in browser DevTools

---

## 📊 Build Performance Summary

| Metric | Value |
|--------|-------|
| Build Time | 11.80s |
| Total Bundle Size | ~495 KB |
| Gzipped Size | ~162 KB |
| Modules | 1025 |
| Entry Point | `dist/index.html` |
| Vendor Bundle | Optimized with code splitting |

---

## 🛠️ Environment Variables Reference

### Development (.env.development):
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SERVER_URL=http://localhost:8000
```

### Production (Set in Vercel Dashboard):
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SERVER_URL=https://your-backend-render-url.com
```

---

## 🚀 Next Steps

1. **Push to GitHub** (if not done already)
2. **Deploy Backend** to Render.com or Railway.app
3. **Deploy Frontend** to Vercel
4. **Update CORS** on backend with Vercel frontend URL
5. **Set Environment Variables** in Vercel
6. **Test Production** setup with two devices

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails on Vercel | Check that all dependencies are in `package.json` |
| Frontend can't connect to backend | Verify `VITE_SERVER_URL` is set correctly and backend is running |
| CORS errors | Add Vercel frontend URL to backend's `cors.origin` array |
| Blank page after deploy | Check browser console for errors, verify build output directory is `dist` |

