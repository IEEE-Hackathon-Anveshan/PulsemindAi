# 🛠️ PulseMind Setup Guide

Complete step-by-step instructions to get PulseMind running locally.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [MongoDB Atlas Setup](#1-mongodb-atlas-setup)
3. [Google OAuth Setup](#2-google-oauth-setup)
4. [Google AI (Gemini) Setup](#3-google-ai-gemini-setup)
5. [Project Installation](#4-project-installation)
6. [Environment Configuration](#5-environment-configuration)
7. [Running the Application](#6-running-the-application)
8. [Troubleshooting](#7-troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js v18+** installed ([Download](https://nodejs.org/))
- ✅ **npm** (comes with Node.js)
- ✅ **Git** ([Download](https://git-scm.com/))
- ✅ **Modern web browser** (Chrome, Firefox, Edge, Safari)
- ✅ **Google Account** (for OAuth and Gemini API)
- ✅ **MongoDB Atlas Account** (free tier available)

**Check your versions:**
```bash
node --version   # Should be v18.0.0 or higher
npm --version    # Should be v9.0.0 or higher
git --version    # Any recent version
```

---

## 1. MongoDB Atlas Setup

### **Step 1: Create Free Account**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with Google or email
3. Choose the **Free M0 Sandbox** tier

### **Step 2: Create Cluster**
1. Click **"Build a Database"**
2. Select **"Shared"** (Free)
3. Choose cloud provider: **AWS** (recommended)
4. Select region closest to you
5. Cluster Name: `PulseMind` (or keep default)
6. Click **"Create Cluster"** (takes 1-3 minutes)

### **Step 3: Create Database User**
1. In sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `pulsemind_admin` (or your choice)
5. Password: Click **"Autogenerate Secure Password"** → **Copy it!**
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### **Step 4: Whitelist IP Address**
1. In sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - For production, restrict to specific IPs
4. Click **"Confirm"**

### **Step 5: Get Connection String**
1. Go back to **"Database"** tab
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Driver: **Node.js**
5. Version: **5.5 or later**
6. Copy the connection string (looks like):
   ```
   mongodb+srv://pulsemind_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<password>` with your actual password from Step 3
8. Add database name before the `?`:
   ```
   mongodb+srv://pulsemind_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/pulsemind?retryWrites=true&w=majority
   ```
9. **Save this string** for later!

---

## 2. Google OAuth Setup

### **Step 1: Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click project dropdown (top left) → **"New Project"**
3. Project name: `PulseMind`
4. Click **"Create"** (takes 10-20 seconds)
5. Ensure new project is selected in dropdown

### **Step 2: Enable Google+ API**
1. In sidebar, go to **APIs & Services** → **"Library"**
2. Search for **"Google+ API"**
3. Click it → Click **"Enable"**

### **Step 3: Configure OAuth Consent Screen**
1. In sidebar, **APIs & Services** → **"OAuth consent screen"**
2. User Type: **External** → Click **"Create"**
3. **App Information:**
   - App name: `PulseMind`
   - User support email: Your email
   - Developer contact: Your email
4. Click **"Save and Continue"**
5. **Scopes:** Click **"Save and Continue"** (skip)
6. **Test users:** Add your Google email → Click **"Save and Continue"**
7. Click **"Back to Dashboard"**

### **Step 4: Create OAuth 2.0 Client ID**
1. In sidebar, **APIs & Services** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Application type: **"Web application"**
4. Name: `PulseMind Web Client`
5. **Authorized JavaScript origins** → Click **"Add URI"**:
   ```
   http://localhost:5173
   http://localhost:5000
   ```
   *(Add production domain later)*
6. **Authorized redirect URIs** → Click **"Add URI"**:
   ```
   http://localhost:5173
   ```
7. Click **"Create"**

### **Step 5: Copy Credentials**
A popup appears with:
- **Client ID**: `123456789-abcd...apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-XXXXXXXXXXXX`

**Copy both!** You can also download JSON for safekeeping.

### **Step 6: Add Tunnel/Production URLs Later**
When deploying or using port forwarding:
1. Go back to **Credentials** → Click your OAuth Client ID
2. Add additional origins/redirects:
   ```
   https://your-production-domain.com
   https://k0t3l44v-5173.inc1.devtunnels.ms  # Example tunnel URL
   ```
3. Click **"Save"** (takes 5-10 minutes to propagate)

---

## 3. Google AI (Gemini) Setup

### **Step 1: Get API Key**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API key"**
4. Select your **Google Cloud project** (PulseMind from Step 2.1)
   - Or click **"Create API key in new project"**
5. Click **"Create API key"**
6. **Copy the key** (starts with `AIza...`)

### **Step 2: Test API (Optional)**
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```
Should return JSON with AI response.

---

## 4. Project Installation

### **Step 1: Clone Repository**
```bash
# Via HTTPS
git clone https://github.com/PulseMind-AI/PulseMind.git

# Or via SSH (if configured)
git clone git@github.com:PulseMind-AI/PulseMind.git

cd PulseMind
```

### **Step 2: Install Frontend Dependencies**
```bash
npm install
```
Wait for all packages to install (~2-3 minutes on first run).

### **Step 3: Install Backend Dependencies**
```bash
cd server
npm install
cd ..
```

---

## 5. Environment Configuration

### **Step 1: Create .env File**
```bash
# Copy example file
cp .env.example .env

# Open in your editor
code .env  # VS Code
# or
notepad .env  # Windows
# or
nano .env  # Linux/Mac
```

### **Step 2: Fill in Your Credentials**
Replace placeholder values with your actual credentials from previous steps:

```bash
# From Google AI Studio (Step 3)
VITE_GOOGLE_AI_API_KEY=AIzaSy...YOUR_ACTUAL_KEY

# From Google OAuth (Step 2.5)
VITE_GOOGLE_OAUTH_CLIENT_ID=123456789-abc...apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-XXXXXXXXXXXXX

# From MongoDB Atlas (Step 1.5)
MONGODB_URI=mongodb+srv://pulsemind_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/pulsemind?retryWrites=true&w=majority

# Generate JWT Secret
# Run this command and copy output:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Paste result here:
JWT_SECRET=YOUR_GENERATED_SECRET

# Server port (default is fine)
PORT=5000
```

### **Step 3: Verify .env File**
Ensure:
- ✅ No spaces around `=` signs
- ✅ No quotes around values
- ✅ MongoDB password has no `<` or `>` brackets
- ✅ All fields filled in

**Example correct line:**
```bash
MONGODB_URI=mongodb+srv://admin:MyP@ssw0rd@cluster0.abc123.mongodb.net/pulsemind?retryWrites=true&w=majority
```

---

## 6. Running the Application

### **Option A: Two Separate Terminals (Recommended for Development)**

**Terminal 1: Backend Server**
```bash
node server/server.js
```
Expected output:
```
Server running on port 5000
✅ Connected to MongoDB successfully
```

**Terminal 2: Frontend Dev Server**
```bash
npm run dev
```
Expected output:
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### **Option B: Single Terminal (Production-like)**
```bash
# Start backend in background
node server/server.js &

# Start frontend
npm run dev
```

### **Step 3: Open in Browser**
Navigate to: **http://localhost:5173**

You should see the PulseMind homepage!

---

## 7. Troubleshooting

### **Issue: "MongoDB connection error"**

**Cause:** Invalid connection string or network access not configured.

**Solutions:**
1. Check `.env` MONGODB_URI has correct password (no `<` `>`)
2. Verify IP whitelist in MongoDB Atlas (0.0.0.0/0 for development)
3. Check database user has "Read and write to any database" privileges
4. Try pinging MongoDB:
   ```bash
   ping cluster0.xxxxx.mongodb.net
   ```

---

### **Issue: "Google authentication failed"**

**Cause:** OAuth credentials invalid or origins not whitelisted.

**Solutions:**
1. Verify `VITE_GOOGLE_OAUTH_CLIENT_ID` matches Google Console exactly
2. Check Authorized JavaScript origins include `http://localhost:5173`
3. Wait 5-10 minutes after changing OAuth settings (propagation delay)
4. Clear browser cache and try again
5. Check browser console for specific error message

---

### **Issue: "Port 5000 already in use"**

**Cause:** Another process (often previous server instance) is using port 5000.

**Solutions:**

**Windows:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual number from above)
taskkill /F /PID <PID>
```

**Mac/Linux:**
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9
```

**Or change port in `.env`:**
```bash
PORT=5001
```
Then update API calls in frontend if needed.

---

### **Issue: "Cannot find module" errors**

**Cause:** Dependencies not installed properly.

**Solutions:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Also for backend
cd server
rm -rf node_modules package-lock.json
npm install
cd ..
```

---

### **Issue: Chat with Pulse doesn't respond**

**Cause:** Google AI API key invalid or not loaded.

**Solutions:**
1. Verify `VITE_GOOGLE_AI_API_KEY` in `.env` is correct (starts with `AIza`)
2. Check API key has quota remaining (free tier: 60 requests/minute)
3. Restart frontend dev server after changing `.env`
4. Check browser console for API errors

**Test API key manually:**
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

---

### **Issue: "CORS errors" in browser console**

**Cause:** Frontend trying to access backend from different origin.

**Solutions:**
1. Ensure backend is running on port 5000
2. Ensure frontend is accessing `http://localhost:5000` (not 127.0.0.1 or different port)
3. Backend `server.js` already has `app.use(cors())` - verify it's uncommented

---

### **Issue: Environment variables not loading**

**Cause:** `.env` file not in correct location or syntax errors.

**Solutions:**
1. Ensure `.env` is in project root (same level as `package.json`)
2. No spaces around `=` signs:
   ```bash
   # ❌ Wrong
   JWT_SECRET = my_secret
   
   # ✅ Correct
   JWT_SECRET=my_secret
   ```
3. Restart both servers after editing `.env`
4. Verify variables load:
   ```bash
   node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET)"
   ```

---

### **Issue: Sentiscope not generating recommendations**

**Cause:** Google AI API issue or analysis parsing error.

**Solutions:**
1. Check browser console for Gemini API errors
2. Verify API key has quota
3. Check network tab for 429 (rate limit) or 401 (invalid key) errors
4. Try a fallback recommendation (code should handle this)

---

### **Issue: Readiness meter not updating**

**Cause:** Engagement tracking not firing or polling not working.

**Solutions:**
1. Check browser console for tracking API errors
2. Verify JWT token is valid (logout/login again)
3. Open Profile page and wait 10 seconds (auto-refresh)
4. Switch to another tab and back (visibility-change triggers refresh)
5. Check backend logs for engagement tracking messages:
   ```
   ✅ Assessment complete - User: username, Score: 75
   ```

---

## 🎉 Success Checklist

Once everything is working, you should see:

- ✅ Homepage loads at `http://localhost:5173`
- ✅ Can sign up with email/password
- ✅ Can login with Google OAuth
- ✅ Chat with Pulse responds to messages
- ✅ Sentiscope generates therapy recommendations
- ✅ Profile shows Readiness Meter with current phase
- ✅ Therapy pages track adoption (check Profile after visiting)
- ✅ Community features gated until Full-Access phase
- ✅ Toxic messages blocked in chat

---

## 📧 Still Having Issues?

1. **Check existing issues**: [GitHub Issues](https://github.com/PulseMind-AI/PulseMind/issues)
2. **Create new issue**: Include:
   - Error message (full text)
   - Steps to reproduce
   - Your OS and Node.js version
   - Browser console logs
   - Backend server logs
3. **Contact**: karthik.b.college@gmail.com

---

## 🚀 Next Steps

Once setup is complete:
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system
2. Review [CONTRIBUTING.md](./CONTRIBUTING.md) if you want to contribute
3. Test the Progressive Trust Ladder flow:
   - Create new user
   - Complete Sentiscope
   - Visit 2 therapy pages
   - Watch readiness meter advance phases
4. Test admin account: `admin@pulsemind.com` / `PulseMindAdmin2025!`

**Happy coding! 💙**
