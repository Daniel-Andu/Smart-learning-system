# Environment Variables Checklist - CRITICAL

## The Problem
You're getting 404 errors because the frontend is calling the wrong URL:
- ❌ Wrong: `https://eduverse-backend-qz4a.onrender.com/auth/login`
- ✅ Correct: `https://eduverse-backend-qz4a.onrender.com/api/auth/login`

## Step-by-Step Fix

### 1. Student Frontend (Vercel)

1. Go to https://vercel.com/dashboard
2. Click on your student frontend project
3. Go to **Settings** tab
4. Click on **Environment Variables** in the left sidebar
5. Look for `VITE_API_URL`
6. If it exists, click **Edit** and change it to:
   ```
   VITE_API_URL=https://eduverse-backend-qz4a.onrender.com/api
   ```
7. If it doesn't exist, click **Add New** and add:
   - Name: `VITE_API_URL`
   - Value: `https://eduverse-backend-qz4a.onrender.com/api`
   - Environment: All (Production, Preview, Development)
8. Click **Save**

### 2. Admin Frontend (Vercel)

1. Go to https://vercel.com/dashboard
2. Click on your admin frontend project
3. Go to **Settings** tab
4. Click on **Environment Variables** in the left sidebar
5. Look for `VITE_API_URL`
6. If it exists, click **Edit** and change it to:
   ```
   VITE_API_URL=https://eduverse-backend-qz4a.onrender.com/api
   ```
7. If it doesn't exist, click **Add New** and add:
   - Name: `VITE_API_URL`
   - Value: `https://eduverse-backend-qz4a.onrender.com/api`
   - Environment: All (Production, Preview, Development)
8. Click **Save**

### 3. Backend (Render)

1. Go to https://dashboard.render.com
2. Click on your backend service (eduverse-backend-qz4a)
3. Scroll down to **Environment** section
4. Add or verify these environment variables:
   ```
   STUDENT_FRONTEND_URL=https://smart-learning-system-6ndj-woad.vercel.app
   ADMIN_FRONTEND_URL=https://smart-learning-system-fpyv.vercel.app
   INSTRUCTOR_FRONTEND_URL=https://your-instructor-frontend.vercel.app
   ```
5. Click **Save Changes**

### 4. Redeploy All Services

**Backend (Render):**
1. In your backend service on Render
2. Click **Manual Deploy** button
3. Select **Deploy latest commit**
4. Wait for deployment to complete

**Student Frontend (Vercel):**
1. In your student frontend project on Vercel
2. Go to **Deployments** tab
3. Find the latest deployment
4. Click the three dots (⋮) next to it
5. Select **Redeploy**
6. Wait for deployment to complete

**Admin Frontend (Vercel):**
1. In your admin frontend project on Vercel
2. Go to **Deployments** tab
3. Find the latest deployment
4. Click the three dots (⋮) next to it
5. Select **Redeploy**
6. Wait for deployment to complete

### 5. Clear Browser Cache

1. Open your browser
2. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
3. Select "Cached images and files"
4. Click "Clear data"
5. Close and reopen your browser

### 6. Test

1. Visit your student frontend URL
2. Try to register a new account
3. Try to login
4. Visit your admin frontend URL
5. Try to login with admin credentials

## How to Verify It's Working

Open your browser's Developer Console (F12) and look at the Network tab when you try to login:

**❌ Still Wrong (404 Error):**
```
Request URL: https://eduverse-backend-qz4a.onrender.com/auth/login
Status: 404 Not Found
```

**✅ Fixed (Should Work):**
```
Request URL: https://eduverse-backend-qz4a.onrender.com/api/auth/login
Status: 200 OK
```

## Common Mistakes

1. ❌ `VITE_API_URL=https://eduverse-backend-qz4a.onrender.com` (missing /api)
2. ❌ `VITE_API_URL=https://eduverse-backend-qz4a.onrender.com/api/` (trailing slash)
3. ✅ `VITE_API_URL=https://eduverse-backend-qz4a.onrender.com/api` (correct)

## Still Having Issues?

If you've followed all steps and still get errors:

1. Check the browser console for the exact error message
2. Check the Network tab to see what URL is being called
3. Verify the environment variables are set for ALL environments (Production, Preview, Development)
4. Make sure you redeployed after changing environment variables
5. Check Render logs for backend errors
6. Check Vercel logs for frontend build errors
