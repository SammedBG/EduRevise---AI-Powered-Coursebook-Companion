# 🚀 Deploy Now - Quick Guide

## ⚡ Critical Fix Applied

**Issue**: Users logged out immediately after login  
**Fix**: Changed cookie `sameSite` from `'strict'` to `'none'` for cross-origin authentication

---

## 📋 Deploy in 3 Steps

### **Step 1: Push Code to GitHub** (2 minutes)

```bash
# From your project root
git add .
git commit -m "Fix: Update cookie settings for cross-origin authentication (Vercel + Render)"
git push origin main
```

**What happens**:
- ✅ Vercel will auto-deploy frontend (2-3 minutes)
- ✅ Render will auto-deploy backend (5-10 minutes)

---

### **Step 2: Verify Backend Environment** (1 minute)

**Go to**: https://dashboard.render.com

1. Select: `study-buddy-api` (your backend service)
2. Click: **Environment** tab
3. **Verify these variables exist**:
   ```bash
   NODE_ENV=production
   CORS_ORIGIN=https://study-buddy-ai-powered-learning-com.vercel.app
   ```
4. If `NODE_ENV` is not `production`, **ADD IT**:
   - Click "Add Environment Variable"
   - Key: `NODE_ENV`
   - Value: `production`
   - Click "Save Changes"

**Important**: `NODE_ENV=production` is REQUIRED for the cookie fix to work!

---

### **Step 3: Test** (2 minutes)

**Go to**: https://study-buddy-ai-powered-learning-com.vercel.app

1. **Register a new account**
   - Username: test123
   - Email: test@example.com
   - Password: password123
   - Name: Test User
   - Grade: Grade 12

2. **Click "Register"**
   - Should redirect to dashboard
   - Should NOT log you out

3. **Refresh the page**
   - Should stay logged in
   - Dashboard should load

4. **Check browser console**
   - Should see NO errors
   - (401 on first load is normal - before login)

---

## ✅ Success Indicators

### **You'll know it's working when**:
- ✅ Can register successfully
- ✅ Redirected to dashboard after login
- ✅ Dashboard loads with data
- ✅ Refresh doesn't log you out
- ✅ Can navigate between pages
- ✅ No CORS errors in console

---

## 🚨 If Still Having Issues

### **Check Browser Cookies** (DevTools → Application → Cookies)

**Look for**:
- Cookie name: `token`
- Domain: `.onrender.com`
- SameSite: `None` (in production)
- Secure: `true` (checkmark)

**If cookie is missing or SameSite is not `None`**:
1. Verify `NODE_ENV=production` in Render
2. Redeploy backend manually:
   - Render Dashboard → Manual Deploy → "Deploy latest commit"
3. Wait 5-10 minutes
4. Clear browser cookies
5. Try registering again

---

## 📊 Deployment Timeline

| Step | Time | Status |
|------|------|--------|
| Git push | 1 min | ⏳ Waiting |
| Vercel build | 2-3 min | ⏳ Waiting |
| Render build | 5-10 min | ⏳ Waiting |
| **Total** | **8-14 min** | ⏳ Waiting |

---

## 🔍 Monitor Deployment

### **Vercel**
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click: Latest deployment
4. Watch: Build logs

### **Render**
1. Go to: https://dashboard.render.com
2. Select: `study-buddy-api`
3. Click: **Logs** tab
4. Watch: Deployment logs

---

## 💡 Pro Tips

1. **Clear Browser Cache**: After deployment, do a hard refresh (Ctrl+Shift+R)
2. **Incognito Mode**: Test in private browsing to avoid cache issues
3. **Check Cookies**: Use DevTools to verify cookie is being set
4. **Wait for Deploy**: Both services need to finish deploying

---

## 🎯 What Changed

| File | Change | Why |
|------|--------|-----|
| `server/routes/auth.js` | `sameSite: 'none'` in production | Allow cross-origin cookies |
| `server/routes/auth.js` | Register route updated | Fix login persistence |
| `server/routes/auth.js` | Login route updated | Fix login persistence |
| `server/routes/auth.js` | Logout route updated | Match cookie settings |

---

## 📞 Still Need Help?

### **Check Logs**:
```bash
# Render logs
Go to: https://dashboard.render.com → Logs

# Vercel logs
Go to: https://vercel.com/dashboard → Runtime Logs
```

### **Test Backend Health**:
```bash
curl https://study-buddy-ai-powered-learning-companion.onrender.com/api/health
```

**Expected**:
```json
{"status":"OK","message":"Study Buddy API is running"}
```

---

**🎉 Ready to deploy? Run Step 1 now!**

```bash
git add .
git commit -m "Fix: Update cookie settings for cross-origin authentication"
git push origin main
```

*Then wait 10 minutes and test at:*  
**https://study-buddy-ai-powered-learning-com.vercel.app**
