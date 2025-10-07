# Study Buddy - Complete Deployment Guide

[![Deployment](https://img.shields.io/badge/Deployment-Guide-blue.svg)](https://github.com/yourusername/study-buddy)
[![Platforms](https://img.shields.io/badge/Platforms-Multi-green.svg)](https://studybuddy.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)

## 🎯 Overview

This comprehensive guide covers deployment of Study Buddy across multiple platforms, from local development to production-scale deployments. Study Buddy is a full-stack application with AI-powered features requiring careful configuration of LLM APIs and database services.

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v18+ (recommended: v20 LTS)
- **MongoDB**: v6.0+ (local or cloud)
- **Git**: Latest version
- **Memory**: Minimum 4GB RAM (8GB recommended for AI features)

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/study-buddy.git
cd study-buddy

# Quick setup (Windows)
start.bat

# Quick setup (Linux/Mac)
./start.sh
```

### 2. Manual Setup (Alternative)
```bash
# Install all dependencies
npm run install-all

# Create environment file
cp server/.env.example server/.env

# Edit server/.env with your configuration
# Required: MONGODB_URI, JWT_SECRET
# AI Features: GROQ_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY
# YouTube: YOUTUBE_API_KEY

# Seed database with sample data
cd server && npm run seed && cd ..

# Start the application
npm run dev
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **Demo Login**: student@demo.com / password123

## 🌐 Production Deployment

### Option 1: Vercel + MongoDB Atlas + Railway

#### Frontend Deployment (Vercel)
1. **Prepare Frontend**:
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel

   # Set environment variables in Vercel dashboard
   REACT_APP_API_URL=https://your-backend-url.com/api
   ```

#### Backend Deployment (Railway)
1. **Prepare Backend**:
   ```bash
   cd server
   # Ensure all dependencies are in package.json
   ```

2. **Deploy to Railway**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login and deploy
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables**:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-buddy
   JWT_SECRET=your-super-secret-jwt-key
   OPENAI_API_KEY=your-openai-api-key
   NODE_ENV=production
   ```

#### Database Setup (MongoDB Atlas)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string
4. Update MONGODB_URI in backend environment

### Option 2: Heroku Deployment

#### Frontend (Netlify)
1. Connect GitHub repository to Netlify
2. Set build command: `cd client && npm run build`
3. Set publish directory: `client/build`
4. Add environment variable: `REACT_APP_API_URL=https://your-heroku-app.herokuapp.com/api`

#### Backend (Heroku)
1. **Prepare for Heroku**:
   ```bash
   # Create Procfile in server directory
   echo "web: node index.js" > server/Procfile
   
   # Update package.json scripts
   # Add "engines" field specifying Node.js version
   ```

2. **Deploy to Heroku**:
   ```bash
   # Install Heroku CLI
   # Login to Heroku
   heroku login
   
   # Create Heroku app
   heroku create study-buddy-api
   
   # Set environment variables
   heroku config:set MONGODB_URI=your-mongodb-connection-string
   heroku config:set JWT_SECRET=your-jwt-secret
   heroku config:set NODE_ENV=production
   
   # Deploy
   git subtree push --prefix server heroku main
   ```

### Option 3: Docker Deployment

#### Create Dockerfile for Backend
```dockerfile
# server/Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

#### Create Dockerfile for Frontend
```dockerfile
# client/Dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: study-buddy-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./server
    container_name: study-buddy-backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/study-buddy?authSource=admin
      - JWT_SECRET=your-jwt-secret
      - NODE_ENV=production
    depends_on:
      - mongodb

  frontend:
    build: ./client
    container_name: study-buddy-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

#### Deploy with Docker
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔧 Environment Configuration

### Backend Environment Variables (server/.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database (Required)
MONGODB_URI=mongodb://localhost:27017/study-buddy
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/study-buddy

# Authentication (Required)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# AI/LLM APIs (Choose one or more)
GROQ_API_KEY=your-groq-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
HF_API_TOKEN=your-hugging-face-token-here

# YouTube Integration (Optional)
YOUTUBE_API_KEY=your-youtube-data-api-key-here

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=uploads

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables (client/.env)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Development vs Production
REACT_APP_ENV=development

# Optional: Analytics
REACT_APP_GA_TRACKING_ID=your-google-analytics-id

# Optional: Error Tracking
REACT_APP_SENTRY_DSN=your-sentry-dsn
```

### Environment-Specific Configurations

#### Development
```env
NODE_ENV=development
DEBUG=study-buddy:*
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
```

#### Staging
```env
NODE_ENV=staging
LOG_LEVEL=info
CORS_ORIGIN=https://staging.studybuddy.com
MONGODB_URI=mongodb+srv://staging:password@cluster.mongodb.net/study-buddy-staging
```

#### Production
```env
NODE_ENV=production
LOG_LEVEL=warn
CORS_ORIGIN=https://studybuddy.com
MONGODB_URI=mongodb+srv://prod:password@cluster.mongodb.net/study-buddy-prod
```

## 📊 Monitoring and Maintenance

### Health Checks
- Backend: `GET /api/health`
- Frontend: Check if React app loads

### Logs
- Backend logs: Check console output or use PM2
- Frontend logs: Browser developer tools

### Database Maintenance
```bash
# Backup MongoDB
mongodump --uri="your-mongodb-connection-string" --out backup/

# Restore MongoDB
mongorestore --uri="your-mongodb-connection-string" backup/
```

### Performance Monitoring
- Use tools like New Relic, DataDog, or built-in monitoring
- Monitor API response times
- Track database query performance
- Monitor file upload sizes and processing times

## 🔒 Security Considerations

### Production Security
1. **Environment Variables**: Never commit `.env` files
2. **HTTPS**: Use SSL certificates for production
3. **CORS**: Configure CORS properly for your domain
4. **Rate Limiting**: Already implemented in the backend
5. **File Upload**: Validate file types and sizes
6. **JWT**: Use strong, random JWT secrets
7. **Database**: Use MongoDB Atlas with proper authentication

### Security Headers
The application already includes:
- Helmet.js for security headers
- Rate limiting
- CORS configuration
- Input validation

## 🚨 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection string format
mongodb://username:password@host:port/database
```

#### 2. Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### 3. Build Failures
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. Environment Variables Not Loading
- Ensure `.env` file is in the correct location
- Check variable names match exactly
- Restart the application after changes

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Or for specific modules
DEBUG=study-buddy:* npm run dev
```

## 📈 Scaling Considerations

### Horizontal Scaling
1. **Load Balancer**: Use nginx or cloud load balancer
2. **Multiple Backend Instances**: Deploy multiple backend containers
3. **Database Clustering**: Use MongoDB replica sets
4. **File Storage**: Move to cloud storage (AWS S3, Google Cloud Storage)

### Performance Optimization
1. **CDN**: Use CloudFlare or AWS CloudFront for static assets
2. **Caching**: Implement Redis for session storage
3. **Database Indexing**: Add proper indexes for frequently queried fields
4. **Image Optimization**: Compress and optimize uploaded files

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy Study Buddy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm run install-all
      
    - name: Build frontend
      run: cd client && npm run build
      
    - name: Deploy to production
      run: |
        # Add your deployment commands here
        echo "Deploying to production..."
```

## 📞 Support

For deployment issues:
1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed
4. Check database connectivity
5. Review the troubleshooting section above

## 🎯 Next Steps

After successful deployment:
1. Set up monitoring and alerts
2. Configure automated backups
3. Implement CI/CD pipeline
4. Set up SSL certificates
5. Configure custom domain
6. Set up error tracking (Sentry)
7. Implement user analytics

---

**Happy Deploying! 🚀**
