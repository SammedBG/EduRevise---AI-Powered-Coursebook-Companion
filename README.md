# 📚 Study Buddy - AI-Powered Learning Companion

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://mongodb.com/cloud/atlas)
[![AWS S3](https://img.shields.io/badge/AWS-S3-orange.svg)](https://aws.amazon.com/s3/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Study Buddy** is a comprehensive AI-powered learning companion platform designed for students. Upload your PDF course materials and transform them into interactive study sessions with AI chat, auto-generated quizzes, progress tracking, and personalized video recommendations.

---

## 🎯 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [How It Works](#-how-it-works)
- [AI/LLM Integration](#-aillm-integration)
- [Setup & Installation](#-setup--installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [What's Implemented](#-whats-implemented)
- [Known Limitations](#-known-limitations)
- [Future Enhancements](#-future-enhancements)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### **Core Features (100% Implemented)**

#### **1. PDF Management**
- ✅ Upload PDFs up to 10MB
- ✅ Cloud storage using AWS S3
- ✅ Advanced text extraction with OCR support
- ✅ Vector embeddings for semantic search
- ✅ PDF preview and management
- ✅ Delete and organize documents

#### **2. AI Chat System**
- ✅ Context-aware conversations based on uploaded PDFs
- ✅ RAG (Retrieval Augmented Generation) with citations
- ✅ Page numbers and source quotes in responses
- ✅ Multi-chat management (create, rename, delete)
- ✅ Auto-generated chat titles
- ✅ ChatGPT-inspired UI with typing indicators
- ✅ Search through chat history

#### **3. Quiz Generation**
- ✅ **MCQs** (Multiple Choice Questions) - 4 options each
- ✅ **SAQs** (Short Answer Questions) - Text-based, 2-3 sentences
- ✅ **LAQs** (Long Answer Questions) - Detailed paragraph responses
- ✅ AI-generated questions from PDF content
- ✅ Automatic scoring with partial credit for SAQs/LAQs
- ✅ Detailed explanations for every question
- ✅ Source references (page numbers, snippets from PDFs)
- ✅ Store all quiz attempts with complete history
- ✅ Regenerate new questions with different settings
- ✅ Multiple difficulty levels (Easy, Medium, Hard, Mixed)

#### **4. Progress Tracking**
- ✅ Visual dashboard with analytics
- ✅ Subject-specific performance metrics
- ✅ Weak/strong area identification
- ✅ Mastery levels for topics
- ✅ Learning streaks and gamification
- ✅ Performance charts and graphs
- ✅ Quiz history with detailed results

#### **5. YouTube Integration**
- ✅ AI-recommended educational videos
- ✅ Content matching based on PDF topics
- ✅ Rich metadata (views, likes, duration)
- ✅ Direct video links
- ✅ Thumbnail previews

#### **6. User Authentication**
- ✅ Secure registration and login
- ✅ JWT-based authentication
- ✅ Dual approach: HttpOnly cookies + localStorage tokens
- ✅ User profiles with customization
- ✅ Session management

#### **7. Modern UI/UX**
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ ChatGPT-inspired chat interface
- ✅ Purple/Indigo theme with gradients
- ✅ Loading states and error handling
- ✅ Toast notifications
- ✅ Split-view PDF viewer

---

## 🛠️ Technology Stack

### **Frontend**
```
React 18.x          - UI library
Tailwind CSS        - Styling framework
React Router        - Navigation
Axios               - HTTP client
React Hot Toast     - Notifications
React Icons         - Icon library
```

### **Backend**
```
Node.js 18.x        - Runtime environment
Express.js          - Web framework
MongoDB Atlas       - Database (NoSQL)
Mongoose            - ODM for MongoDB
JWT                 - Authentication
bcryptjs            - Password hashing
Multer              - File upload handling
AWS SDK v3          - S3 cloud storage
pdf-parse           - PDF text extraction
Tesseract.js        - OCR support
```

### **AI/LLM Services**
```
GROQ API            - Primary LLM (Llama 3.3 70B)
Google Gemini       - Embeddings & fallback chat
OpenAI GPT-4        - Premium fallback
Hugging Face        - Alternative LLM
YouTube Data API    - Video recommendations
```

### **Deployment & Storage**
```
Vercel              - Frontend hosting
Render.com          - Backend hosting
MongoDB Atlas       - Database hosting
AWS S3              - File storage (ap-south-1)
```

---

## 🏗️ Project Architecture

### **Directory Structure**
```
study-buddy/
├── client/                      # React frontend
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── logo.svg
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Auth/           # Login/Register
│   │   │   ├── Chat/           # Chat interface
│   │   │   ├── Dashboard/      # Dashboard
│   │   │   ├── Layout/         # Navbar, etc.
│   │   │   ├── PDF/            # PDF management
│   │   │   ├── Progress/       # Progress tracking
│   │   │   ├── Quiz/           # Quiz components
│   │   │   └── YouTube/        # Video recommendations
│   │   ├── contexts/           # React Context (Auth)
│   │   ├── services/           # API services
│   │   ├── utils/              # Utility functions
│   │   ├── App.js              # Main app component
│   │   └── index.js            # Entry point
│   └── package.json
│
├── server/                      # Node.js backend
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js            # User model
│   │   ├── PDF.js             # PDF document model
│   │   ├── Chat.js            # Chat conversation model
│   │   ├── Quiz.js            # Quiz model
│   │   └── Progress.js        # Progress tracking model
│   ├── routes/                # API endpoints
│   │   ├── auth.js           # Authentication routes
│   │   ├── pdfs.js           # PDF management
│   │   ├── chat.js           # Chat functionality
│   │   ├── quiz.js           # Quiz generation
│   │   ├── progress.js       # Progress tracking
│   │   └── youtube.js        # YouTube integration
│   ├── scripts/              # Utility scripts
│   │   └── seedData.js       # Database seeding
│   ├── uploads/              # Local file storage (dev only)
│   ├── index.js              # Express server
│   ├── package.json
│   └── env.template          # Environment variables template
│
├── render.yaml               # Render.com deployment config
├── vercel.json              # Vercel deployment config
├── start.sh                 # Startup script
└── README.md               # This file
```

### **Data Flow**

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ←HTTP→  │   Backend   │ ←TCP→   │   MongoDB   │
│   (Vercel)  │         │  (Render)   │         │   (Atlas)   │
└─────────────┘         └─────────────┘         └─────────────┘
       ↓                        ↓                        ↑
       │                        ↓                        │
       │                 ┌─────────────┐                │
       │                 │   AWS S3    │                │
       │                 │ (PDFs Store)│                │
       │                 └─────────────┘                │
       │                        ↓                        │
       │                 ┌─────────────┐                │
       └────────────────→│  LLM APIs   │────────────────┘
                         │GROQ/Gemini  │
                         └─────────────┘
```

---

## ⚙️ How It Works

### **1. User Journey**

```mermaid
graph TD
    A[Register/Login] --> B[Upload PDFs]
    B --> C[PDF Processing]
    C --> D{Choose Action}
    D --> E[Chat with AI]
    D --> F[Generate Quiz]
    D --> G[View Progress]
    E --> H[Get AI Answers with Citations]
    F --> I[Take Quiz & Get Scored]
    G --> J[See Analytics & Recommendations]
    H --> K[YouTube Videos]
    I --> K
```

### **2. PDF Processing Pipeline**

```
1. Upload PDF → 2. Store in S3 → 3. Extract Text → 4. Chunk Content
    ↓                  ↓                ↓               ↓
5. Generate Embeddings → 6. Store in MongoDB → 7. Ready for Use
```

**Detailed Steps:**
1. **Upload**: User selects PDF file (max 10MB)
2. **S3 Storage**: File uploaded to AWS S3 bucket (secure, scalable)
3. **Text Extraction**: `pdf-parse` extracts text content
4. **Chunking**: Text split into 500-character chunks with 100-char overlap
5. **Embeddings**: Each chunk converted to vector using Gemini API
6. **Database**: Metadata, text, chunks, and embeddings stored in MongoDB
7. **Ready**: PDF available for chat, quiz generation, and search

### **3. AI Chat System (RAG)**

```
User Query → Semantic Search → Retrieve Relevant Chunks → LLM Response
     ↓              ↓                    ↓                      ↓
   "What is     Find top 5          Extract from          "According to
photosynthesis?"  matching         pages 23, 45          page 23: '...'"
                  chunks
```

**RAG Implementation:**
1. User asks a question
2. Query converted to embedding (vector)
3. Cosine similarity search finds relevant PDF chunks
4. Top 5 chunks retrieved with context
5. Chunks + query sent to LLM (GROQ/Gemini)
6. LLM generates answer with citations
7. Response includes page numbers and direct quotes

### **4. Quiz Generation**

```
Select PDFs → Extract Content → Send to LLM → Parse Questions
     ↓              ↓                ↓              ↓
Choose 2 PDFs   Read 50KB    GROQ generates    Store in DB
Difficulty:    from each     MCQs, SAQs,       with explanations
Medium         PDF           LAQs              and sources
```

**Question Generation:**
1. User selects PDFs and settings (difficulty, types, count)
2. Backend extracts relevant content from PDFs
3. Prompt sent to GROQ API: "Generate 10 medium-difficulty questions..."
4. LLM returns JSON with questions, options, answers, explanations
5. Questions stored in database
6. User takes quiz, answers are scored
7. Results saved with detailed feedback

### **5. Progress Tracking**

```
Quiz Attempts → Calculate Metrics → Identify Patterns → Show Analytics
      ↓                ↓                   ↓                  ↓
   10 quizzes     75% average      Weak: Physics      Dashboard with
   completed      score            Strong: Math        charts & insights
```

---

## 🤖 AI/LLM Integration

### **LLM Usage Breakdown**

| Feature | Primary LLM | Model | Purpose |
|---------|-------------|-------|---------|
| **Chat Responses** | GROQ | `llama-3.3-70b-versatile` | Answer questions from PDFs with citations |
| **Quiz Generation** | GROQ | `llama-3.3-70b-versatile` | Generate MCQs, SAQs, LAQs with explanations |
| **PDF Embeddings** | Google Gemini | `text-embedding-004` | Convert text chunks to vectors for semantic search |
| **Chat Naming** | GROQ | `llama-3.3-70b-versatile` | Auto-generate descriptive chat titles |
| **Progress Analysis** | GROQ | `llama-3.3-70b-versatile` | Identify weak/strong areas, generate recommendations |
| **YouTube Search** | YouTube Data API | N/A | Find relevant educational videos |

### **Multi-LLM Fallback Strategy**

```
Primary: GROQ (Llama 3.3 70B)
   ↓ (if fails)
Secondary: Google Gemini (gemini-1.5-flash)
   ↓ (if fails)
Tertiary: OpenAI (GPT-4o-mini)
   ↓ (if fails)
Quaternary: Hugging Face (various models)
   ↓ (if fails)
Fallback: Mock responses (offline mode)
```

### **Why These LLMs?**

1. **GROQ (Primary)**
   - **Speed**: 300-500 tokens/sec (fastest)
   - **Cost**: Free tier generous, paid very affordable
   - **Quality**: Llama 3.3 70B rivals GPT-4
   - **Reliability**: 99.9% uptime

2. **Google Gemini (Embeddings)**
   - **Free**: Generous free tier
   - **Quality**: Best embedding model for semantic search
   - **Speed**: Fast batch processing
   - **Integration**: Easy API

3. **OpenAI (Premium Fallback)**
   - **Quality**: Industry-leading responses
   - **Reliability**: Most stable API
   - **Cost**: Higher, so used as fallback

---

## 🚀 Setup & Installation

### **Prerequisites**

Before you begin, ensure you have:

- **Node.js**: v18.x or higher ([Download](https://nodejs.org/))
- **npm**: v9.x or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **MongoDB Atlas Account**: Free ([Sign up](https://www.mongodb.com/cloud/atlas))
- **AWS Account**: For S3 storage ([Sign up](https://aws.amazon.com/))
- **API Keys**: GROQ, Gemini (see Configuration section)

### **Step 1: Clone Repository**

```bash
# Clone the repository
git clone https://github.com/SammedBG/Study-Buddy---AI-Powered-Learning-Companion.git

# Navigate to project directory
cd study-buddy
```

### **Step 2: Install Dependencies**

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Return to root directory
cd ..
```

**Expected time**: 3-5 minutes

---

## ⚙️ Configuration

### **1. MongoDB Atlas Setup**

1. **Create Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Create Cluster**: Select FREE tier (M0)
3. **Create Database User**:
   - Username: `studybuddy`
   - Password: Generate strong password (save it!)
4. **Whitelist IP**: Add `0.0.0.0/0` to allow connections from anywhere
5. **Get Connection String**: 
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password
   - Example: `mongodb+srv://studybuddy:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/study-buddy`

### **2. AWS S3 Setup**

#### **Create S3 Bucket**

1. **Login to AWS**: [AWS Console](https://console.aws.amazon.com)
2. **Go to S3**: Search "S3" in services
3. **Create Bucket**:
   - **Name**: `study-buddy-pdfs-YOUR_NAME` (must be globally unique)
   - **Region**: Choose closest to you (e.g., `ap-south-1` for Mumbai)
   - **Block Public Access**: Keep all blocked (for security)
   - **Versioning**: Disabled
   - **Encryption**: Enable default encryption (SSE-S3)
4. **Create Bucket**

#### **Create IAM User**

1. **Go to IAM**: Search "IAM" in AWS console
2. **Users** → **Create User**:
   - **User name**: `study-buddy-app`
   - **Access type**: Programmatic access only
3. **Permissions**: Attach existing policy directly
4. **Create Custom Policy**:
   - Click "Create Policy" → JSON tab
   - Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
    }
  ]
}
```

5. **Save Credentials**:
   - **Access Key ID**: `AKIA...` (save this!)
   - **Secret Access Key**: (save this! shown only once)

#### **Configure CORS (for uploads)**

1. **Go to your bucket** → **Permissions** → **CORS**
2. **Add this configuration**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### **3. Get API Keys**

#### **GROQ API (Required - Primary LLM)**

1. **Sign up**: [console.groq.com](https://console.groq.com)
2. **Create API Key**: Dashboard → API Keys → Create
3. **Copy key**: Starts with `gsk_...`
4. **Free tier**: Very generous, sufficient for development

#### **Google Gemini API (Required - For Embeddings)**

1. **Go to**: [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Create API Key**: Click "Create API Key"
3. **Copy key**: Starts with `AIza...`
4. **Free tier**: 60 requests/minute, more than enough

#### **OpenAI API (Optional - Premium Fallback)**

1. **Sign up**: [platform.openai.com](https://platform.openai.com)
2. **Create API Key**: API Keys → Create new secret key
3. **Copy key**: Starts with `sk-...`
4. **Note**: Paid service, requires credit card

#### **YouTube Data API (Optional - For Video Recommendations)**

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com)
2. **Create Project**: New Project → Name it "Study Buddy"
3. **Enable API**: APIs & Services → Enable APIs → YouTube Data API v3
4. **Create Credentials**: Credentials → Create → API Key
5. **Copy key**: Your YouTube API key

### **4. Environment Variables**

#### **Backend (.env file)**

Create `server/.env` file:

```bash
# Copy template
cp server/env.template server/.env

# Edit with your values
nano server/.env
```

**Complete .env file**:

```bash
# Database
MONGODB_URI=mongodb+srv://studybuddy:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/study-buddy

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-random-string

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# AWS S3 (Required for PDF storage)
AWS_ACCESS_KEY_ID=AKIA...your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=study-buddy-pdfs-your-name

# AI APIs (At least GROQ and GEMINI required)
GROQ_API_KEY=gsk_...your-groq-api-key
GEMINI_API_KEY=AIza...your-gemini-api-key
OPENAI_API_KEY=sk-...your-openai-api-key (optional)
HF_API_TOKEN=hf_...your-huggingface-token (optional)

# YouTube API (Optional)
YOUTUBE_API_KEY=your-youtube-data-api-key
```

#### **Frontend (.env file)**

Create `client/.env` file:

```bash
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🏃 Running the Application

### **Option 1: Using Startup Script (Recommended)**

```bash
# From project root
chmod +x start.sh
./start.sh
```

This script will:
- Check for required dependencies
- Install missing packages
- Start backend on http://localhost:5000
- Start frontend on http://localhost:3000
- Open browser automatically

### **Option 2: Manual Start**

#### **Terminal 1: Backend**

```bash
cd server
npm install
npm run dev
```

**Expected output**:
```
Server running on port 5000
MongoDB connected successfully
```

#### **Terminal 2: Frontend**

```bash
cd client
npm install
npm start
```

**Expected output**:
```
Compiled successfully!
webpack compiled with 0 warnings

Local:            http://localhost:3000
On Your Network:  http://192.168.1.x:3000
```

### **Accessing the Application**

1. **Frontend**: http://localhost:3000
2. **Backend API**: http://localhost:5000/api
3. **Health Check**: http://localhost:5000/api/health

### **First Time Setup**

1. **Open** http://localhost:3000
2. **Click** "Register"
3. **Fill in**:
   - Username: Your choice
   - Email: Your email
   - Password: Minimum 6 characters
   - Name: Your full name
   - Grade: Select your grade level
4. **Submit** → You'll be logged in automatically
5. **Upload a PDF** → Go to PDF Manager
6. **Start using** → Chat, generate quizzes, track progress!

---

## 🌐 Deployment

### **Production URLs**
- **Frontend**: https://study-buddy-ai-powered-learning-com.vercel.app
- **Backend**: https://study-buddy-ai-powered-learning-companion.onrender.com

### **Deploy to Vercel (Frontend)**

#### **1. Connect GitHub**

1. **Go to**: [vercel.com](https://vercel.com)
2. **Sign up/Login** with GitHub
3. **New Project** → Import repository
4. **Select**: `study-buddy` repository

#### **2. Configure Build Settings**

- **Framework Preset**: Create React App
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `build`

#### **3. Add Environment Variables**

In Vercel dashboard → Settings → Environment Variables:

```bash
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

#### **4. Deploy**

Click "Deploy" → Wait 2-3 minutes → Done!

### **Deploy to Render (Backend)**

#### **1. Connect GitHub**

1. **Go to**: [render.com](https://render.com)
2. **Sign up/Login** with GitHub
3. **New** → **Web Service**
4. **Connect** your repository

#### **2. Configure Service**

- **Name**: `study-buddy-api`
- **Environment**: Node
- **Region**: Choose closest to you
- **Branch**: main
- **Root Directory**: (leave empty)
- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && npm start`

#### **3. Add Environment Variables**

Add ALL these in Render dashboard:

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...your-connection-string
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-frontend-url.vercel.app

AWS_ACCESS_KEY_ID=AKIA...your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-bucket-name

GROQ_API_KEY=gsk_...your-key
GEMINI_API_KEY=AIza...your-key
OPENAI_API_KEY=sk-...your-key (optional)
YOUTUBE_API_KEY=your-key (optional)
```

#### **4. Deploy**

Click "Create Web Service" → Wait 5-10 minutes → Done!

### **Post-Deployment Checklist**

- [ ] Frontend loads without errors
- [ ] Can register new account
- [ ] Can login successfully
- [ ] Can upload PDF (test with small PDF first)
- [ ] Can chat with AI
- [ ] Can generate quiz
- [ ] Progress tracking works
- [ ] YouTube recommendations appear

### **Deployment Costs**

#### **Free Tier (Development)**
- **Vercel**: Free (100GB bandwidth/month)
- **Render**: Free (sleeps after 15 min inactivity)
- **MongoDB Atlas**: Free (512MB storage)
- **AWS S3**: Free first 12 months (5GB + 20K requests)
- **GROQ**: Free tier (generous limits)
- **Gemini**: Free tier (60 req/min)
- **Total**: $0/month

#### **Paid Tier (Production)**
- **Vercel**: Free or $20/month (Pro)
- **Render**: $7/month (always on, no sleep)
- **MongoDB Atlas**: Free (M0 sufficient)
- **AWS S3**: ~$1-2/month (actual usage)
- **LLM APIs**: $10-50/month (usage-based)
- **Total**: $18-80/month

---

## 📡 API Documentation

### **Base URL**
- **Local**: `http://localhost:5000/api`
- **Production**: `https://your-backend.onrender.com/api`

### **Authentication**

All protected endpoints require authentication via:
- **HttpOnly Cookie**: `token` (set automatically on login)
- **OR Authorization Header**: `Bearer <token>`

### **Endpoints**

#### **Authentication**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/auth/profile` | Get user profile |
| PUT | `/auth/profile` | Update profile |
| POST | `/auth/logout` | Logout user |

#### **PDF Management**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pdfs/upload` | Upload PDF file |
| GET | `/pdfs` | Get all user's PDFs |
| GET | `/pdfs/:id` | Get specific PDF |
| DELETE | `/pdfs/:id` | Delete PDF |
| GET | `/pdfs/search/:query` | Search PDFs |

#### **Chat**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Create new chat |
| GET | `/chat` | Get all chats |
| GET | `/chat/:id` | Get chat by ID |
| POST | `/chat/:id/messages` | Send message |
| PUT | `/chat/:id/name` | Rename chat |
| DELETE | `/chat/:id` | Delete chat |

#### **Quiz**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/quiz/generate` | Generate new quiz |
| GET | `/quiz` | Get all quizzes |
| GET | `/quiz/:id` | Get quiz by ID |
| POST | `/quiz/:id/submit` | Submit quiz answers |
| GET | `/quiz/:id/results` | Get quiz results |
| POST | `/quiz/:id/regenerate` | Generate new questions |
| DELETE | `/quiz/:id` | Delete quiz |

#### **Progress**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/progress/dashboard` | Get dashboard data |
| GET | `/progress/subject/:subject` | Subject progress |
| GET | `/progress/analytics` | Performance analytics |
| GET | `/progress/recommendations` | Get study recommendations |

#### **YouTube**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/youtube/recommendations/:pdfId` | Get video recommendations |
| GET | `/youtube/video/:videoId` | Get video details |

### **Example Requests**

#### **Register User**

```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123",
  "name": "John Doe",
  "grade": "Grade 12"
}

# Response (201)
{
  "message": "User created successfully",
  "user": {
    "id": "64f...",
    "username": "johndoe",
    "email": "john@example.com"
  },
  "token": "eyJhbG..."
}
```

#### **Upload PDF**

```bash
POST /api/pdfs/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
- pdf: <file>

# Response (201)
{
  "message": "PDF uploaded successfully",
  "pdf": {
    "_id": "64f...",
    "filename": "physics-chapter1.pdf",
    "size": 2048576,
    "metadata": {
      "title": "Physics Chapter 1",
      "pages": 25
    }
  }
}
```

#### **Generate Quiz**

```bash
POST /api/quiz/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "pdfIds": ["64f8a3b2..."],
  "difficulty": "medium",
  "questionTypes": ["mcq", "saq", "laq"],
  "numQuestions": 10
}

# Response (201)
{
  "message": "Quiz generated successfully",
  "quiz": {
    "_id": "64f...",
    "title": "Physics Quiz - Chapter 1",
    "questions": [
      {
        "type": "mcq",
        "question": "What is Newton's First Law?",
        "options": ["...", "...", "...", "..."],
        "points": 1
      }
    ]
  }
}
```

---

## ✅ What's Implemented

### **Completed Features (100%)**

#### **Must-Have Features**
- [x] PDF upload and storage (AWS S3)
- [x] PDF viewer (split-view with chat)
- [x] Text extraction and processing
- [x] AI chat with context from PDFs
- [x] RAG with citations (page numbers + quotes)
- [x] MCQ generation from PDFs
- [x] SAQ generation from PDFs
- [x] LAQ generation from PDFs
- [x] Quiz scoring (automatic)
- [x] Detailed explanations for questions
- [x] Quiz attempt storage
- [x] Progress tracking dashboard
- [x] Performance analytics
- [x] Weak/strong area identification

#### **Nice-to-Have Features**
- [x] ChatGPT-inspired UI
- [x] Multiple chat sessions
- [x] Chat search and management
- [x] Auto-generated chat titles
- [x] YouTube video recommendations
- [x] Video metadata (views, likes, etc.)
- [x] Responsive design (mobile-friendly)
- [x] Modern purple/indigo theme
- [x] Toast notifications
- [x] Loading states
- [x] Error handling

#### **Advanced Features**
- [x] Vector embeddings for semantic search
- [x] Hybrid search (keyword + semantic)
- [x] Multi-LLM fallback system
- [x] Partial credit for text answers
- [x] Source references in all responses
- [x] Quiz regeneration with different settings
- [x] User authentication (JWT + cookies)
- [x] Secure password hashing
- [x] Rate limiting
- [x] CORS configuration
- [x] Cloud deployment ready

---

## 🚧 Known Limitations

### **Current Limitations**

1. **PDF Size**: Maximum 10MB per file
   - **Reason**: Memory management on free-tier servers
   - **Workaround**: Split large PDFs into smaller parts

2. **Scanned PDFs**: OCR support added but limited
   - **Reason**: Tesseract.js performance
   - **Workaround**: Use PDFs with selectable text

3. **Free Tier Sleep**: Render.com sleeps after 15 min inactivity
   - **Impact**: First request takes 30-60 seconds
   - **Solution**: Upgrade to paid plan ($7/month)

4. **Rate Limits**: 100 requests per 15 minutes
   - **Impact**: Heavy usage may hit limits
   - **Solution**: Configurable in code, can be increased

5. **LLM Token Limits**: Responses capped at 4000 tokens
   - **Reason**: API limits and cost management
   - **Impact**: Very long answers may be truncated

6. **Concurrent Users**: Free tier supports ~10-20 concurrent users
   - **Solution**: Upgrade hosting plan for production

---

## 🔮 Future Enhancements

### **Planned Features**

1. **Mobile Apps**
   - React Native iOS/Android apps
   - Offline mode support
   - Push notifications

2. **Collaboration**
   - Multi-user study sessions
   - Shared quizzes and notes
   - Real-time collaboration

3. **Advanced Analytics**
   - ML-powered learning pattern analysis
   - Predictive performance insights
   - Personalized study plans

4. **Content Types**
   - Word documents (.docx)
   - PowerPoint presentations (.pptx)
   - Images with OCR
   - YouTube video transcripts
   - Web articles

5. **Voice Interface**
   - Voice input for questions
   - Text-to-speech for answers
   - Audio quiz mode

6. **Gamification**
   - Achievements and badges
   - Leaderboards
   - Daily challenges
   - Reward points

7. **Export Features**
   - PDF export of quizzes
   - CSV export of progress
   - Study notes generation
   - Flashcard creation

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Backend Won't Start**

**Error**: `Cannot find module 'dotenv'` or similar

**Solution**:
```bash
cd server
rm -rf node_modules package-lock.json
npm install
npm start
```

#### **2. Frontend Build Fails**

**Error**: `Module not found` or build errors

**Solution**:
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

#### **3. MongoDB Connection Failed**

**Error**: `MongoNetworkError` or timeout

**Solutions**:
- Check MongoDB URI in `.env` file
- Verify database user password
- Ensure IP whitelist includes `0.0.0.0/0`
- Check network/firewall settings

#### **4. PDF Upload Fails (500 Error)**

**Error**: `AWS credentials not configured`

**Solutions**:
- Verify `AWS_ACCESS_KEY_ID` in `.env`
- Verify `AWS_SECRET_ACCESS_KEY` in `.env`
- Check S3 bucket name is correct
- Ensure IAM user has proper permissions
- Verify bucket region matches `AWS_REGION`

#### **5. Chat Not Responding**

**Error**: No response or timeout

**Solutions**:
- Check GROQ_API_KEY is set correctly
- Verify API key is active (test at console.groq.com)
- Check network connectivity
- Try fallback: Set GEMINI_API_KEY

#### **6. Quiz Generation Fails**

**Error**: `Failed to generate questions`

**Solutions**:
- Ensure PDF has been processed (uploaded successfully)
- Verify LLM API keys are set
- Check PDF has extractable text (not scanned image)
- Try with smaller number of questions

#### **7. Logged Out After Login**

**Error**: Redirected to login immediately

**Solutions**:
- **Production**: Ensure `NODE_ENV=production` in Render
- **CORS**: Verify `CORS_ORIGIN` matches frontend URL
- **Clear cookies** in browser
- Try incognito mode

#### **8. CORS Errors**

**Error**: `No 'Access-Control-Allow-Origin' header`

**Solutions**:
- Check `CORS_ORIGIN` in backend `.env`
- Verify frontend URL matches exactly (no trailing slash)
- Restart backend after changing `.env`

### **Debug Mode**

Enable detailed logging:

```bash
# Backend
NODE_ENV=development npm run dev

# Frontend
REACT_APP_DEBUG=true npm start
```

### **Check Logs**

**Local Development**:
- Backend: Check terminal where `npm run dev` is running
- Frontend: Check browser console (F12)

**Production**:
- **Render**: Dashboard → Logs tab
- **Vercel**: Dashboard → Runtime Logs
- **MongoDB**: Atlas → Metrics

### **Health Checks**

```bash
# Backend health
curl http://localhost:5000/api/health

# Expected response
{"status":"OK","message":"Study Buddy API is running"}

# Database connection
# Check MongoDB Atlas dashboard → Clusters → Metrics
```

---

## 📝 Development Notes

### **How This Project Was Built**

This project was developed with extensive assistance from AI language models (Claude, ChatGPT) for:

1. **Architecture Design**: System design, database schemas, API structure
2. **Code Generation**: React components, Express routes, utility functions
3. **Problem Solving**: Debugging, optimization, error handling
4. **Documentation**: README, code comments, setup guides
5. **Best Practices**: Security, performance, scalability patterns

**LLM Tools Used**:
- **Claude (Anthropic)**: Primary development assistant
- **ChatGPT (OpenAI)**: Code review and debugging
- **GitHub Copilot**: Code autocompletion
- **GROQ (Llama 3.3)**: Integrated as primary LLM for app features
- **Google Gemini**: Embeddings and fallback chat
- **OpenAI GPT-4**: Premium fallback for chat

**Human Contributions**:
- Project requirements and specifications
- UI/UX design decisions
- Testing and quality assurance
- API key management and deployment
- Final code review and validation

### **Build Process**

```
Week 1: Planning & Setup
  ├── Requirements gathering
  ├── Technology stack selection
  ├── Database schema design
  └── Project structure setup

Week 2: Core Features
  ├── Authentication system
  ├── PDF upload and storage
  ├── Text extraction and processing
  └── Basic chat functionality

Week 3: AI Integration
  ├── GROQ API integration
  ├── RAG implementation
  ├── Quiz generation
  └── Vector embeddings

Week 4: Advanced Features
  ├── Progress tracking
  ├── YouTube integration
  ├── UI/UX improvements
  └── Responsive design

Week 5: Polish & Deploy
  ├── Error handling
  ├── Performance optimization
  ├── Documentation
  └── Production deployment
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### **Development Setup**

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m "Add amazing feature"`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

### **Code Style**

- Use ESLint and Prettier
- Follow existing code patterns
- Add comments for complex logic
- Write meaningful commit messages

---

## 📞 Support

### **Get Help**

- **Documentation**: This README
- **Issues**: [GitHub Issues](https://github.com/yourusername/study-buddy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/study-buddy/discussions)

### **Contact**

- **Email**: support@studybuddy.com
- **Twitter**: [@StudyBuddyApp](https://twitter.com/StudyBuddyApp)
- **Website**: [studybuddy.com](https://studybuddy.com)

---

## 🙏 Acknowledgments

- **GROQ**: For providing fast and affordable LLM inference
- **Google**: For Gemini API and free embeddings
- **MongoDB**: For Atlas free tier
- **AWS**: For S3 free tier
- **Vercel & Render**: For generous free hosting
- **React Team**: For the excellent frontend library
- **Open Source Community**: For all the amazing packages used

---

## 📊 Project Stats

- **Lines of Code**: ~15,000
- **Components**: 25+
- **API Endpoints**: 35+
- **Database Models**: 5
- **Dependencies**: 50+
- **Development Time**: 5 weeks
- **AI Assistance**: 70%
- **Human Input**: 30%

---

**🎓 Happy Learning with Study Buddy!**

*Transform your study materials into an interactive learning experience powered by AI.*

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
