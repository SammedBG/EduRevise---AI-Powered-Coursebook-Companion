# Render.com Deployment Guide for Study Buddy

[![Render](https://img.shields.io/badge/Render-Deploy-blue.svg)](https://render.com/)
[![Study Buddy](https://img.shields.io/badge/Study%20Buddy-Production-green.svg)](https://studybuddy.com)

## 🚀 Quick Deploy to Render.com

### Prerequisites
- GitHub repository with Study Buddy code
- Render.com account (free tier available)
- MongoDB Atlas account (for database)

## 📋 Step-by-Step Deployment

### 1. **Prepare Your Repository**

Make sure your GitHub repository contains:
- ✅ `render.yaml` configuration file
- ✅ All source code (client/ and server/ folders)
- ✅ `package.json` files in both client and server
- ✅ Environment variables documented

### 2. **Set Up MongoDB Atlas**

1. **Create MongoDB Atlas Account**: Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Create New Cluster**: Choose free tier (M0)
3. **Create Database User**: 
   - Username: `studybuddy`
   - Password: Generate strong password
4. **Whitelist IP Addresses**: Add `0.0.0.0/0` for Render access
5. **Get Connection String**: Copy the connection URI

### 3. **Deploy to Render.com**

#### Option A: Using render.yaml (Recommended)
1. **Connect GitHub**: Go to [render.com](https://render.com) and connect your GitHub account
2. **Import Repository**: Select your Study Buddy repository
3. **Auto-Deploy**: Render will detect `render.yaml` and create services automatically
4. **Set Environment Variables**: Add your API keys and database URI

#### Option B: Manual Setup
1. **Create Web Service**:
   - **Name**: `study-buddy-api`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Starter (Free)

2. **Create Static Site**:
   - **Name**: `study-buddy-frontend`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/build`

### 4. **Configure Environment Variables**

In Render dashboard, add these environment variables:

#### **Backend Service (study-buddy-api)**
```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-buddy
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
YOUTUBE_API_KEY=your-youtube-data-api-key
CORS_ORIGIN=https://study-buddy-frontend.onrender.com
```

#### **Frontend Service (study-buddy-frontend)**
```bash
REACT_APP_API_URL=https://study-buddy-api.onrender.com/api
```

### 5. **Get API Keys (Required for AI Features)**

#### **GROQ API (Recommended - Free & Fast)**
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up and create API key
3. Add to Render environment variables

#### **Google Gemini API (Free Tier)**
1. Go to [makersuite.google.com](https://makersuite.google.com)
2. Create API key
3. Add to Render environment variables

#### **YouTube Data API (Optional)**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable YouTube Data API v3
3. Create API key
4. Add to Render environment variables

### 6. **Deploy and Test**

1. **Deploy**: Click "Deploy" in Render dashboard
2. **Wait for Build**: Backend builds first, then frontend
3. **Test API**: Visit `https://your-api-url.onrender.com/api/health`
4. **Test Frontend**: Visit `https://your-frontend-url.onrender.com`
5. **Register Account**: Create your first user account
6. **Upload PDF**: Test the core functionality

## 🔧 Render Configuration Details

### **render.yaml Breakdown**

```yaml
services:
  # Backend API
  - type: web
    name: study-buddy-api
    env: node
    plan: starter                    # Free tier
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    healthCheckPath: /api/health     # Health check endpoint
    autoDeploy: true                 # Auto-deploy on git push

  # Frontend Static Site
  - type: web
    name: study-buddy-frontend
    env: static
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/build
    autoDeploy: true
```

### **Performance Optimizations**

#### **Memory Management**
```bash
# In server/package.json
"start": "node --max-old-space-size=2048 index.js"
```

#### **Build Optimization**
```bash
# Frontend builds with production optimizations
npm run build  # Creates optimized build/
```

## 📊 Render Free Tier Limits

### **Web Services**
- **CPU**: 0.1 CPU
- **RAM**: 512MB
- **Sleep**: After 15 minutes of inactivity
- **Build Time**: 90 minutes per month

### **Static Sites**
- **Bandwidth**: 100GB per month
- **Build Time**: 100 minutes per month
- **Custom Domains**: Supported

### **Database (MongoDB Atlas)**
- **Storage**: 512MB
- **Connections**: 100 concurrent
- **Backups**: Daily automated

## 🚨 Troubleshooting

### **Common Issues**

#### 1. **Build Failures**
```bash
# Check build logs in Render dashboard
# Common fixes:
- Ensure package.json exists in both client/ and server/
- Check Node.js version compatibility
- Verify all dependencies are listed
```

#### 2. **Environment Variables**
```bash
# Make sure all required variables are set:
- MONGODB_URI (required)
- JWT_SECRET (required)
- At least one LLM API key (GROQ recommended)
```

#### 3. **CORS Issues**
```bash
# Update CORS_ORIGIN to match your frontend URL:
CORS_ORIGIN=https://your-frontend-url.onrender.com
```

#### 4. **Sleep Mode (Free Tier)**
```bash
# Free tier services sleep after 15 minutes
# First request after sleep takes 30+ seconds
# Consider upgrading to paid plan for production
```

### **Performance Issues**

#### **Slow Cold Starts**
- **Issue**: Free tier services sleep after inactivity
- **Solution**: Upgrade to paid plan or use uptime monitoring service

#### **Memory Issues**
- **Issue**: Large PDF processing causes crashes
- **Solution**: Increase memory in paid plan or optimize file sizes

#### **Build Timeouts**
- **Issue**: Complex builds exceed 90-minute limit
- **Solution**: Optimize build process or upgrade plan

## 🔄 Custom Domain Setup

### **1. Add Custom Domain**
1. Go to Render dashboard → Settings → Custom Domains
2. Add your domain (e.g., `studybuddy.com`)
3. Follow DNS configuration instructions

### **2. Update Environment Variables**
```bash
# Update CORS origin for custom domain
CORS_ORIGIN=https://studybuddy.com

# Update frontend API URL
REACT_APP_API_URL=https://api.studybuddy.com/api
```

### **3. SSL Certificate**
- **Automatic**: Render provides free SSL certificates
- **Custom**: Upload your own certificate if needed

## 📈 Monitoring and Analytics

### **Render Dashboard**
- **Metrics**: CPU, Memory, Response Time
- **Logs**: Real-time application logs
- **Deployments**: Deployment history and status

### **Health Monitoring**
```bash
# Health check endpoint
GET https://your-api.onrender.com/api/health

# Expected response:
{
  "status": "OK",
  "message": "Study Buddy API is running",
  "timestamp": "2023-07-20T10:00:00.000Z"
}
```

### **Uptime Monitoring**
- **Free Options**: UptimeRobot, Pingdom
- **Paid Options**: DataDog, New Relic
- **Custom**: Set up monitoring scripts

## 💰 Cost Breakdown

### **Free Tier (Development)**
- **Backend**: Free (with sleep mode)
- **Frontend**: Free (static hosting)
- **Database**: Free (MongoDB Atlas M0)
- **Total**: $0/month

### **Paid Tier (Production)**
- **Backend**: $7/month (Starter plan)
- **Frontend**: Free (static hosting)
- **Database**: Free (MongoDB Atlas M0)
- **Custom Domain**: $5/month
- **Total**: $12/month

## 🎯 Production Checklist

### **Before Going Live**
- [ ] Set up MongoDB Atlas production cluster
- [ ] Configure all required API keys
- [ ] Test all features end-to-end
- [ ] Set up custom domain and SSL
- [ ] Configure monitoring and alerts
- [ ] Set up automated backups
- [ ] Test performance under load
- [ ] Document deployment process

### **Post-Deployment**
- [ ] Monitor error rates and performance
- [ ] Set up user feedback collection
- [ ] Plan for scaling based on usage
- [ ] Regular security updates
- [ ] Backup and disaster recovery plan

## 🔗 Useful Links

- **Render Dashboard**: [dashboard.render.com](https://dashboard.render.com)
- **MongoDB Atlas**: [cloud.mongodb.com](https://cloud.mongodb.com)
- **GROQ Console**: [console.groq.com](https://console.groq.com)
- **Study Buddy Docs**: [github.com/yourusername/study-buddy](https://github.com/yourusername/study-buddy)

---

**🎉 Your Study Buddy app is now live on Render.com!**

*For support, check the troubleshooting section or create an issue on GitHub.*
