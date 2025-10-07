# Vercel Deployment Guide for Study Buddy

[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black.svg)](https://vercel.com/)
[![Study Buddy](https://img.shields.io/badge/Study%20Buddy-Production-green.svg)](https://studybuddy.com)

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub repository with Study Buddy code
- Vercel account (free tier available)
- MongoDB Atlas account (for database)

## 📋 Step-by-Step Deployment

### 1. **Prepare Your Repository**

Make sure your GitHub repository contains:
- ✅ `vercel.json` configuration file
- ✅ All source code (client/ and server/ folders)
- ✅ `package.json` files in both client and server
- ✅ Environment variables documented

### 2. **Set Up MongoDB Atlas**

1. **Create MongoDB Atlas Account**: Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Create New Cluster**: Choose free tier (M0)
3. **Create Database User**: 
   - Username: `studybuddy`
   - Password: Generate strong password
4. **Whitelist IP Addresses**: Add `0.0.0.0/0` for Vercel access
5. **Get Connection String**: Copy the connection URI

### 3. **Deploy to Vercel**

#### Option A: Using Vercel CLI (Recommended)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from project root
vercel

# 4. Follow the prompts:
# - Link to existing project? No
# - Project name: study-buddy
# - Directory: ./
# - Override settings? Yes
```

#### Option B: GitHub Integration
1. **Connect GitHub**: Go to [vercel.com](https://vercel.com) and connect your GitHub account
2. **Import Repository**: Select your Study Buddy repository
3. **Auto-Detect**: Vercel will detect `vercel.json` configuration
4. **Deploy**: Click "Deploy" button

### 4. **Configure Environment Variables**

In Vercel dashboard → Settings → Environment Variables:

#### **Production Environment**
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-buddy
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
YOUTUBE_API_KEY=your-youtube-data-api-key
```

#### **Frontend Environment**
```bash
REACT_APP_API_URL=https://your-project.vercel.app/api
```

### 5. **Get API Keys (Required for AI Features)**

#### **GROQ API (Recommended - Free & Fast)**
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up and create API key
3. Add to Vercel environment variables

#### **Google Gemini API (Free Tier)**
1. Go to [makersuite.google.com](https://makersuite.google.com)
2. Create API key
3. Add to Vercel environment variables

#### **YouTube Data API (Optional)**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable YouTube Data API v3
3. Create API key
4. Add to Vercel environment variables

### 6. **Deploy and Test**

1. **Deploy**: Click "Deploy" or run `vercel --prod`
2. **Wait for Build**: Vercel builds both frontend and backend
3. **Test API**: Visit `https://your-project.vercel.app/api/health`
4. **Test Frontend**: Visit `https://your-project.vercel.app`
5. **Register Account**: Create your first user account
6. **Upload PDF**: Test the core functionality

## 🔧 Vercel Configuration Details

### **vercel.json Breakdown**

```json
{
  "version": 2,
  "name": "study-buddy",
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "server/index.js",
      "use": "@vercel/node",
      "config": {
        "maxLambdaSize": "50mb"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "client/build/$1"
    }
  ]
}
```

### **Build Configuration**

#### **Frontend Build**
```json
{
  "src": "client/package.json",
  "use": "@vercel/static-build",
  "config": {
    "distDir": "build"
  }
}
```

#### **Backend Build**
```json
{
  "src": "server/index.js",
  "use": "@vercel/node",
  "config": {
    "maxLambdaSize": "50mb"
  }
}
```

### **Routing Configuration**

```json
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "server/index.js"
  },
  {
    "src": "/(.*)",
    "dest": "client/build/$1"
  }
]
```

## 📊 Vercel Free Tier Limits

### **Serverless Functions**
- **Execution Time**: 10 seconds (free), 60 seconds (pro)
- **Memory**: 1024MB
- **Bandwidth**: 100GB per month
- **Build Time**: 45 minutes per month

### **Static Hosting**
- **Bandwidth**: 100GB per month
- **Build Time**: 100 minutes per month
- **Custom Domains**: Supported
- **Edge Functions**: 100,000 invocations

### **Database (MongoDB Atlas)**
- **Storage**: 512MB
- **Connections**: 100 concurrent
- **Backups**: Daily automated

## 🚨 Troubleshooting

### **Common Issues**

#### 1. **Build Failures**
```bash
# Check build logs in Vercel dashboard
# Common fixes:
- Ensure package.json exists in both client/ and server/
- Check Node.js version compatibility (Vercel uses Node 18.x)
- Verify all dependencies are listed
- Check for TypeScript errors
```

#### 2. **Function Timeout**
```bash
# Increase function timeout in vercel.json
{
  "functions": {
    "server/index.js": {
      "maxDuration": 30
    }
  }
}
```

#### 3. **Environment Variables**
```bash
# Make sure all required variables are set:
- MONGODB_URI (required)
- JWT_SECRET (required)
- At least one LLM API key (GROQ recommended)
```

#### 4. **CORS Issues**
```bash
# Update CORS_ORIGIN in server code:
CORS_ORIGIN=https://your-project.vercel.app
```

#### 5. **Large File Upload**
```bash
# Increase Lambda size limit:
{
  "config": {
    "maxLambdaSize": "50mb"
  }
}
```

### **Performance Issues**

#### **Cold Start Latency**
- **Issue**: Serverless functions have cold start delays
- **Solution**: Use Vercel Pro for better performance or implement warming strategies

#### **Memory Limitations**
- **Issue**: PDF processing may exceed memory limits
- **Solution**: Optimize file processing or upgrade to Pro plan

#### **Function Timeouts**
- **Issue**: Complex operations exceed 10-second limit
- **Solution**: Break down operations or upgrade to Pro plan (60 seconds)

## 🔄 Custom Domain Setup

### **1. Add Custom Domain**
1. Go to Vercel dashboard → Settings → Domains
2. Add your domain (e.g., `studybuddy.com`)
3. Follow DNS configuration instructions

### **2. Update Environment Variables**
```bash
# Update CORS origin for custom domain
CORS_ORIGIN=https://studybuddy.com

# Update frontend API URL
REACT_APP_API_URL=https://studybuddy.com/api
```

### **3. SSL Certificate**
- **Automatic**: Vercel provides free SSL certificates
- **Custom**: Upload your own certificate if needed

## 📈 Monitoring and Analytics

### **Vercel Dashboard**
- **Analytics**: Page views, performance metrics
- **Functions**: Execution times, error rates
- **Deployments**: Deployment history and status
- **Logs**: Real-time function logs

### **Health Monitoring**
```bash
# Health check endpoint
GET https://your-project.vercel.app/api/health

# Expected response:
{
  "status": "OK",
  "message": "Study Buddy API is running",
  "timestamp": "2023-07-20T10:00:00.000Z"
}
```

### **Performance Monitoring**
- **Core Web Vitals**: LCP, FID, CLS
- **Function Metrics**: Duration, memory usage
- **Error Tracking**: Automatic error detection

## 💰 Cost Breakdown

### **Free Tier (Development)**
- **Frontend**: Free (static hosting)
- **Backend**: Free (serverless functions)
- **Database**: Free (MongoDB Atlas M0)
- **Bandwidth**: 100GB/month
- **Total**: $0/month

### **Pro Tier (Production)**
- **Frontend**: $20/month (per team member)
- **Backend**: Included in Pro
- **Database**: Free (MongoDB Atlas M0)
- **Bandwidth**: 1TB/month
- **Total**: $20/month per developer

## 🎯 Production Checklist

### **Before Going Live**
- [ ] Set up MongoDB Atlas production cluster
- [ ] Configure all required API keys
- [ ] Test all features end-to-end
- [ ] Set up custom domain and SSL
- [ ] Configure monitoring and alerts
- [ ] Test performance under load
- [ ] Set up automated backups
- [ ] Document deployment process

### **Post-Deployment**
- [ ] Monitor error rates and performance
- [ ] Set up user feedback collection
- [ ] Plan for scaling based on usage
- [ ] Regular security updates
- [ ] Backup and disaster recovery plan

## 🔧 Advanced Configuration

### **Edge Functions (Optional)**
```javascript
// api/health.js - Edge function example
export default function handler(req, res) {
  res.status(200).json({
    status: 'OK',
    message: 'Study Buddy API is running',
    timestamp: new Date().toISOString()
  });
}
```

### **Middleware Configuration**
```javascript
// middleware.js
export function middleware(request) {
  // Add custom middleware logic
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*'
};
```

### **Environment-Specific Builds**
```json
{
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build",
        "env": {
          "NODE_ENV": "production"
        }
      }
    }
  ]
}
```

## 🔗 Useful Links

- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Vercel CLI**: [vercel.com/docs/cli](https://vercel.com/docs/cli)
- **MongoDB Atlas**: [cloud.mongodb.com](https://cloud.mongodb.com)
- **GROQ Console**: [console.groq.com](https://console.groq.com)
- **Study Buddy Docs**: [github.com/yourusername/study-buddy](https://github.com/yourusername/study-buddy)

## 🚀 Quick Commands

### **Deploy Commands**
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

### **Environment Management**
```bash
# Add environment variable
vercel env add VARIABLE_NAME

# List environment variables
vercel env ls

# Pull environment variables
vercel env pull .env.local
```

---

**🎉 Your Study Buddy app is now live on Vercel!**

*For support, check the troubleshooting section or create an issue on GitHub.*
