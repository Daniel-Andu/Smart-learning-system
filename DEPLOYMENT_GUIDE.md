# Deployment Guide - Environment Variables Configuration

## Problem: CORS Errors in Production

The CORS errors you're experiencing occur because the backend needs to know which frontend URLs are allowed to make requests. When deploying to different platforms (Render for backend, Vercel for frontends), you must configure the environment variables correctly.

## CRITICAL: Fix the API URL Issue

Your error logs show:
```
eduverse-backend-qz4a.onrender.com/analytics/public/stats:1  Failed to load resource: net::ERR_CONNECTION_REFUSED
```

This indicates the frontend is trying to access the backend WITHOUT the `/api` prefix. The correct URL should be:
```
https://eduverse-backend-qz4a.onrender.com/api/analytics/public/stats
```

**This is happening because the VITE_API_URL environment variable is not set correctly in your Vercel deployment.**

## QUICK SUMMARY - What You Need to Do

### Step 1: Update Backend Environment Variables (Render)
Add these to your Render backend environment:
```
STUDENT_FRONTEND_URL=https://smart-learning-system-6ndj-woad.vercel.app
ADMIN_FRONTEND_URL=https://your-admin-frontend.vercel.app
INSTRUCTOR_FRONTEND_URL=https://your-instructor-frontend.vercel.app
```

### Step 2: Update Student Frontend Environment Variables (Vercel)
Add this to your Vercel student frontend environment:
```
VITE_API_URL=https://eduverse-backend-qz4a.onrender.com/api
```
**MUST include `/api` at the end!**

### Step 3: Update Admin Frontend Environment Variables (Vercel)
Add this to your Vercel admin frontend environment:
```
VITE_API_URL=https://eduverse-backend-qz4a.onrender.com/api
```
**MUST include `/api` at the end!**

### Step 4: Redeploy All Services
- Redeploy backend on Render
- Redeploy student frontend on Vercel
- Redeploy admin frontend on Vercel

### Step 5: Clear Browser Cache and Test
- Clear your browser cache
- Try logging in again
- Check that the errors are resolved

## Quick Fix Steps

### 1. Backend (Render) - Environment Variables

You need to add these environment variables in your Render dashboard for the backend:

```
STUDENT_FRONTEND_URL=https://smart-learning-system-6ndj-woad.vercel.app
ADMIN_FRONTEND_URL=https://your-admin-frontend.vercel.app
INSTRUCTOR_FRONTEND_URL=https://your-instructor-frontend.vercel.app
```

**Important:**
- Replace `your-admin-frontend.vercel.app` with your actual admin frontend Vercel URL
- Replace `your-instructor-frontend.vercel.app` with your actual instructor frontend Vercel URL (if you have one)
- Keep the student frontend URL as shown

### 2. Student Frontend (Vercel) - Environment Variables

In your Vercel project settings for the student frontend, add:

```
VITE_API_URL=https://eduverse-backend-qz4a.onrender.com/api
```

**CRITICAL:** The URL MUST end with `/api` - without it, all API calls will fail.

### 3. Admin Frontend (Vercel) - Environment Variables

In your Vercel project settings for the admin frontend, add:

```
VITE_API_URL=https://eduverse-backend-qz4a.onrender.com/api
```

**CRITICAL:** The URL MUST end with `/api` - without it, all API calls will fail.

## How to Add Environment Variables

### For Render (Backend):

1. Go to your Render dashboard
2. Select your backend service (eduverse-backend-qz4a)
3. Click on "Environment" tab
4. Add the environment variables listed above
5. Click "Save Changes"
6. **Important:** After adding environment variables, you need to redeploy the service for changes to take effect

### For Vercel (Frontends):

1. Go to your Vercel dashboard
2. Select your project (student-frontend or admin-frontend)
3. Go to "Settings" > "Environment Variables"
4. Add the environment variable
5. Click "Save"
6. **Important:** After adding environment variables, you need to redeploy the project for changes to take effect

## How to Redeploy

### Render:
- Go to your service dashboard
- Click "Manual Deploy" > "Deploy latest commit"
- OR push a new commit to trigger automatic deployment

### Vercel:
- Go to your project dashboard
- Click "Deployments" tab
- Click the three dots next to the latest deployment
- Select "Redeploy"

## Additional Environment Variables to Check

Make sure these are also configured in your backend (Render):

```
DATABASE_URL=your_supabase_database_url
JWT_SECRET=your_secure_jwt_secret
JWT_REFRESH_SECRET=your_secure_refresh_secret
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

## Verification

After updating environment variables and redeploying:

1. Clear your browser cache
2. Try logging in again
3. Check browser console for CORS errors
4. If you still see errors, verify the URLs are correct (no typos, no trailing slashes)
5. **IMPORTANT:** Check that the API URL includes `/api` at the end

## Troubleshooting Common Issues

### Issue: "Failed to fetch stats: AxiosError: Network Error"
**Cause:** The frontend is calling the wrong URL (missing `/api` prefix)
**Solution:** Ensure `VITE_API_URL` in Vercel environment variables is:
```
https://eduverse-backend-qz4a.onrender.com/api
```
NOT:
```
https://eduverse-backend-qz4a.onrender.com
```

### Issue: "eduverse-backend-qz4a.onrender.com/analytics/public/stats:1 Failed to load resource: net::ERR_CONNECTION_REFUSED"
**Cause:** Same as above - missing `/api` in the base URL
**Solution:** Add `/api` to the end of `VITE_API_URL` in both frontends

### Issue: "Access to XMLHttpRequest blocked by CORS policy"
**Cause:** Backend doesn't have your frontend URLs in CORS allowlist
**Solution:** Add the frontend URLs to backend environment variables in Render:
```
STUDENT_FRONTEND_URL=https://smart-learning-system-6ndj-woad.vercel.app
ADMIN_FRONTEND_URL=https://your-admin-frontend.vercel.app
```

### Issue: "Network Error" on login/register
**Cause:** Either CORS issue or wrong API URL
**Solution:**
1. Check browser console for the exact error
2. Verify `VITE_API_URL` includes `/api`
3. Verify backend CORS configuration includes your frontend URLs
4. Check that backend is running on Render

## Common Issues

### Issue: "Network Error" persists
- Check that the backend URL is correct
- Verify the backend is running and accessible
- Check Render logs for any errors

### Issue: CORS error still appears
- Verify you added the environment variables to the correct service
- Make sure you redeployed after adding variables
- Check that the URLs in the error match what you configured

### Issue: "Connection Refused"
- The backend might be down or starting up
- Check Render dashboard for service status
- Verify the backend URL is correct

## Development vs Production

For local development, your `.env` files should use:
- Backend: `http://localhost:5000`
- Student Frontend: `http://localhost:3000`
- Admin Frontend: `http://localhost:3001`

For production (your current setup):
- Backend: `https://eduverse-backend-qz4a.onrender.com`
- Student Frontend: `https://smart-learning-system-6ndj-woad.vercel.app`
- Admin Frontend: Your Vercel admin URL

## Need Help?

If you're still experiencing issues after following these steps:
1. Check the browser console for specific error messages
2. Check Render logs for backend errors
3. Check Vercel logs for frontend errors
4. Verify all URLs are accessible by opening them in a browser
