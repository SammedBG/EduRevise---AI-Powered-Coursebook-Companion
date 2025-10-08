# 📚 Study Buddy - AI-Powered Learning Platform

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://mongodb.com/cloud/atlas)
[![AWS S3](https://img.shields.io/badge/AWS-S3-orange.svg)](https://aws.amazon.com/s3/)
[![Deployed](https://img.shields.io/badge/Deployed-Render%20%7C%20Vercel-purple.svg)](https://render.com/)

**Study Buddy** is a comprehensive AI-powered learning platform that transforms PDF documents into interactive study materials. Students can upload their course materials, chat with an AI tutor, generate quizzes, track their progress, and get personalized recommendations.

## 🎯 Features

### ✅ **Core Features (Implemented)**

#### **1. PDF Management & Processing**
- **Upload & Store**: Secure cloud storage using AWS S3
- **Text Extraction**: Advanced PDF parsing with OCR support
- **Chunking & Embeddings**: Vector embeddings for semantic search
- **RAG System**: Retrieval-Augmented Generation with citations
- **Hybrid Search**: Keyword + semantic search capabilities

#### **2. AI Chat System**
- **Multiple LLM Support**: GROQ, Google Gemini, OpenAI, Hugging Face
- **Context-Aware**: Answers based on uploaded PDFs
- **Citations**: Page numbers and source quotes
- **Chat Management**: Save, rename, delete conversations
- **Auto-Naming**: Intelligent chat title generation

#### **3. Quiz Generation Engine**
- **Multiple Formats**: MCQs, Short Answer, Long Answer Questions
- **Smart Generation**: Based on PDF content and difficulty levels
- **Detailed Explanations**: Step-by-step answer explanations
- **Scoring System**: Automatic grading with feedback
- **Attempt Tracking**: Store and review quiz history

#### **4. Progress Tracking**
- **Dashboard Analytics**: Visual progress overview
- **Subject-Specific Stats**: Performance by subject/topic
- **Weak/Strong Areas**: AI-identified learning patterns
- **Mastery Levels**: Progress tracking with recommendations
- **Learning Streaks**: Gamification elements

#### **5. YouTube Integration**
- **Educational Videos**: AI-recommended relevant content
- **Content Matching**: Videos matched to PDF topics
- **Rich Metadata**: Thumbnails, duration, views, likes
- **Direct Links**: Seamless video access

#### **6. User Authentication**
- **Secure Login**: JWT-based authentication
- **HttpOnly Cookies**: Enhanced security
- **User Profiles**: Personalized experience
- **Session Management**: Automatic logout and refresh

### 🎨 **UI/UX Features**
- **Modern Design**: Clean, professional interface
- **Responsive Layout**: Mobile-friendly design
- **ChatGPT-Inspired Chat**: Familiar chat interface
- **Dark/Light Theme**: User preference support
- **Loading States**: Smooth user experience
- **Error Handling**: Comprehensive error management

## 🏗️ Architecture

### **Frontend (React.js)**
```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Auth/           # Login/Register components
│   │   ├── Chat/           # Chat interface
│   │   ├── PDF/            # PDF management
│   │   ├── Quiz/           # Quiz components
│   │   ├── Progress/       # Progress tracking
│   │   └── YouTube/        # Video recommendations
│   ├── contexts/           # React Context providers
│   ├── services/           # API service layer
│   └── utils/              # Utility functions
```

### **Backend (Node.js + Express)**
```
server/
├── routes/                 # API endpoints
│   ├── auth.js            # Authentication routes
│   ├── pdfs.js            # PDF management
│   ├── chat.js            # Chat functionality
│   ├── quiz.js            # Quiz generation
│   ├── progress.js        # Progress tracking
│   └── youtube.js         # YouTube integration
├── models/                # MongoDB schemas
├── middleware/            # Custom middleware
└── utils/                 # Helper functions
```

### **Database (MongoDB Atlas)**
- **Users**: Authentication and profiles
- **PDFs**: Document metadata and content
- **Chats**: Conversation history
- **Quizzes**: Generated questions and attempts
- **Progress**: Learning analytics

### **Storage (AWS S3)**
- **Secure Storage**: Private bucket with signed URLs
- **User Isolation**: Files organized by user ID
- **Automatic Cleanup**: Failed uploads removed
- **Scalable**: Handles unlimited files

## 🤖 AI/LLM Integration

### **Primary LLM: GROQ (Llama 3.1 70B)**
- **Purpose**: Main chat responses and quiz generation
- **Why GROQ**: Fast inference, cost-effective, reliable
- **Model**: `llama-3.3-70b-versatile`
- **Usage**: 
  - Chat conversations with PDF context
  - Quiz question generation
  - Answer explanations
  - Progress analysis

### **Secondary LLM: Google Gemini**
- **Purpose**: Embeddings and fallback chat
- **Model**: `gemini-1.5-flash` (chat), `text-embedding-004` (embeddings)
- **Usage**:
  - Vector embeddings for PDF chunks
  - Semantic search functionality
  - Fallback chat responses
  - Content analysis

### **Fallback LLMs**
- **OpenAI GPT-4**: Premium chat responses
- **Hugging Face**: Alternative chat and quiz generation
- **Mock Responses**: Offline functionality

### **LLM Usage Breakdown**

| Feature | Primary LLM | Secondary | Purpose |
|---------|-------------|-----------|---------|
| **Chat Responses** | GROQ (Llama 3.1 70B) | Gemini, OpenAI | Context-aware answers with citations |
| **Quiz Generation** | GROQ (Llama 3.1 70B) | Hugging Face | MCQs, SAQs, LAQs with explanations |
| **PDF Embeddings** | Gemini (text-embedding-004) | OpenAI (text-embedding-3-small) | Vector search and RAG |
| **Chat Naming** | GROQ (Llama 3.3 70B) | - | Auto-generate descriptive titles |
| **Progress Analysis** | GROQ (Llama 3.1 70B) | - | Identify weak/strong areas |
| **YouTube Recommendations** | GROQ (Llama 3.1 70B) | - | Match videos to PDF content |

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18.x or higher
- MongoDB Atlas account
- AWS account (for S3 storage)
- API keys for LLM services

### **1. Clone Repository**
```bash
git clone https://github.com/yourusername/study-buddy.git
cd study-buddy
```

### **2. Install Dependencies**
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### **3. Environment Setup**

#### **Backend Environment (`server/.env`)**
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-buddy

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# AWS S3 Configuration (Required)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-s3-bucket-name

# AI API Keys (At least one required)
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-google-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
HF_API_TOKEN=your-huggingface-api-token

# YouTube API (Optional)
YOUTUBE_API_KEY=your-youtube-data-api-key
```

#### **Frontend Environment (`client/.env`)**
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

### **4. Run Development Servers**
```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend client
cd client
npm start
```

### **5. Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 📋 Setup Guides

### **AWS S3 Setup**
1. **Create S3 Bucket**: [AWS Console](https://console.aws.amazon.com/s3)
2. **Create IAM User**: With S3 permissions
3. **Get Credentials**: Access key and secret key
4. **Configure CORS**: For web uploads
5. **Test Connection**: Run `node server/test-s3.js`

See [AWS_S3_SETUP.md](AWS_S3_SETUP.md) for detailed instructions.

### **MongoDB Atlas Setup**
1. **Create Cluster**: [MongoDB Atlas](https://cloud.mongodb.com)
2. **Create Database User**: With read/write permissions
3. **Whitelist IP**: Add `0.0.0.0/0` for development
4. **Get Connection String**: Update `MONGODB_URI`

### **LLM API Setup**

#### **GROQ API (Recommended)**
1. **Sign Up**: [console.groq.com](https://console.groq.com)
2. **Create API Key**: Free tier available
3. **Add to .env**: `GROQ_API_KEY=your-key`

#### **Google Gemini API**
1. **Google AI Studio**: [makersuite.google.com](https://makersuite.google.com)
2. **Create API Key**: Free tier available
3. **Add to .env**: `GEMINI_API_KEY=your-key`

#### **OpenAI API**
1. **OpenAI Platform**: [platform.openai.com](https://platform.openai.com)
2. **Create API Key**: Paid service
3. **Add to .env**: `OPENAI_API_KEY=your-key`

## 🚀 Deployment

### **Render.com Deployment**
1. **Connect GitHub**: Link your repository
2. **Auto-Deploy**: Uses `render.yaml` configuration
3. **Set Environment Variables**: Add all required keys
4. **Deploy**: Automatic deployment on git push

See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for detailed instructions.

### **Vercel Deployment**
1. **Import Project**: Connect GitHub repository
2. **Configure Build**: Uses `vercel.json` settings
3. **Environment Variables**: Add in Vercel dashboard
4. **Deploy**: Automatic deployment

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed instructions.

## 💰 Cost Analysis

### **Free Tier Limits**
- **AWS S3**: 5GB storage, 20K requests/month (12 months)
- **MongoDB Atlas**: 512MB storage, 100 connections
- **GROQ**: Free tier with rate limits
- **Google Gemini**: Free tier available
- **Render**: Free tier with sleep mode
- **Vercel**: Free tier with bandwidth limits

### **Production Costs (100 users)**
- **AWS S3**: $1-5/month
- **MongoDB Atlas**: Free (M0 tier)
- **LLM APIs**: $10-50/month
- **Hosting**: $7-20/month
- **Total**: $18-75/month

## 🧪 Testing

### **API Testing**
```bash
# Health check
curl http://localhost:5000/api/health

# Test S3 connection
cd server
node test-s3.js

# Test authentication
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123","name":"Test User","grade":"Grade 12"}'
```

### **Frontend Testing**
```bash
# Start client
cd client
npm start

# Run tests
npm test

# Build for production
npm run build
```

## 🔧 Development

### **Project Structure**
```
study-buddy/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── docs/                   # Documentation
├── render.yaml            # Render deployment config
├── vercel.json            # Vercel deployment config
└── README.md              # This file
```

### **Key Technologies**
- **Frontend**: React 18, Tailwind CSS, React Router, Axios
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Storage**: AWS S3, Multer, AWS SDK v3
- **AI/ML**: GROQ, Google Gemini, OpenAI, Hugging Face
- **Authentication**: JWT, HttpOnly Cookies, bcrypt
- **Deployment**: Render.com, Vercel

### **Code Quality**
- **Error Handling**: Comprehensive error management
- **Input Validation**: Request validation and sanitization
- **Security**: CORS, rate limiting, secure headers
- **Performance**: Memory management, file cleanup
- **Logging**: Structured logging and monitoring

## 📊 Performance & Monitoring

### **Optimizations**
- **Memory Management**: Node.js heap optimization
- **File Processing**: Chunked processing for large PDFs
- **Database Indexing**: Optimized queries
- **CDN**: Static asset delivery
- **Caching**: API response caching

### **Monitoring**
- **Health Checks**: `/api/health` endpoint
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response times and throughput
- **Resource Usage**: Memory and CPU monitoring

## 🚧 Known Issues & Limitations

### **Current Limitations**
1. **PDF Size**: 10MB limit per file
2. **Text Extraction**: Scanned PDFs need OCR
3. **Rate Limits**: API rate limiting on free tiers
4. **Cold Starts**: Serverless deployment delays

### **Future Enhancements**
1. **Mobile App**: React Native version
2. **Offline Mode**: PWA capabilities
3. **Collaboration**: Multi-user study sessions
4. **Advanced Analytics**: Learning pattern analysis
5. **Voice Interface**: Audio input/output
6. **Document Types**: Support for Word, PowerPoint

## 🤝 Contributing

### **Development Setup**
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and test
4. Commit: `git commit -m "Add new feature"`
5. Push: `git push origin feature/new-feature`
6. Create Pull Request

### **Code Style**
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format
- **TypeScript**: Future migration planned

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **GROQ**: For providing fast LLM inference
- **Google**: For Gemini API and embeddings
- **AWS**: For reliable cloud storage
- **MongoDB**: For database services
- **React Team**: For the excellent frontend framework
- **OpenAI**: For GPT models and embeddings

## 📞 Support

### **Documentation**
- [Setup Guide](docs/SETUP.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

### **Community**
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community support and ideas
- **Discord**: Real-time community chat

### **Contact**
- **Email**: support@studybuddy.com
- **Twitter**: [@StudyBuddyApp](https://twitter.com/StudyBuddyApp)
- **Website**: [studybuddy.com](https://studybuddy.com)

---

**🎓 Happy Learning with Study Buddy!**

*Transform your study materials into an interactive learning experience with the power of AI.*