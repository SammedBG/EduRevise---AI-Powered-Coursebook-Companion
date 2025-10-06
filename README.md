# Study Buddy - AI-Powered Learning Companion

A comprehensive web application that helps school students revise from their coursebooks using AI-powered features including PDF processing, intelligent chat, quiz generation, and progress tracking.

## 🚀 Features

### Must-Have Features ✅
- **PDF Upload & Management**: Upload and manage study materials (PDFs)
- **PDF Viewer**: Display uploaded PDFs alongside chat interface
- **Quiz Generator**: Generate MCQs, SAQs, and LAQs from PDF content
- **Progress Tracking**: Track learning progress with analytics and recommendations
- **Source Selector**: Choose between all PDFs or specific PDFs for context

### Nice-to-Have Features ✅
- **ChatGPT-inspired Chat UI**: Clean, responsive chat interface with message history
- **RAG Implementation**: PDF text extraction, chunking, and context-aware responses
- **Mobile Responsive**: Fully responsive design for all devices
- **Real-time Progress Dashboard**: Comprehensive analytics and learning insights

## 🛠️ Tech Stack

### Frontend
- **React.js** (Pure JavaScript, no TypeScript)
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **React Icons** for UI icons
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **PDF-Parse** for PDF text extraction
- **OpenAI API** integration (configurable)

### Development Tools
- **Concurrently** for running frontend and backend simultaneously
- **Nodemon** for backend development
- **React Scripts** for frontend development

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- OpenAI API key (optional, for enhanced AI features)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd study-buddy
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (frontend + backend)
npm run install-all
```

### 3. Environment Configuration
```bash
# Copy environment template
cp server/env.example server/.env

# Edit server/.env with your configuration
nano server/.env
```

**Required Environment Variables:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/study-buddy
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

### 4. Database Setup
Make sure MongoDB is running on your system:
```bash
# Start MongoDB (if installed locally)
mongod

# Or use MongoDB Atlas cloud instance
# Update MONGODB_URI in .env file
```

### 5. Run the Application

#### Development Mode (Recommended)
```bash
# Runs both frontend and backend concurrently
npm run dev
```

#### Individual Services
```bash
# Backend only (runs on http://localhost:5000)
npm run server

# Frontend only (runs on http://localhost:3000)
npm run client
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 📱 Usage Guide

### Getting Started
1. **Register/Login**: Create an account or sign in
2. **Upload PDFs**: Go to Study Materials and upload your coursebooks
3. **Start Chatting**: Use the AI Chat to ask questions about your materials
4. **Take Quizzes**: Generate and take practice quizzes
5. **Track Progress**: Monitor your learning journey in the Progress section

### Key Features Usage

#### PDF Management
- Upload PDF files (up to 50MB)
- Search through uploaded materials
- Process PDFs for AI analysis
- Delete unwanted files

#### AI Chat
- Create new chat sessions
- Ask questions about your study materials
- Get citations and source references
- Switch between different chats

#### Quiz Generation
- Select one or more PDFs
- Choose question types (MCQ, SAQ, LAQ)
- Take timed quizzes
- Review results and explanations

#### Progress Tracking
- View overall performance statistics
- Track subject-wise progress
- Get personalized recommendations
- Monitor learning streaks

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### PDF Management
- `POST /api/pdfs/upload` - Upload PDF file
- `GET /api/pdfs` - Get all user PDFs
- `GET /api/pdfs/:id` - Get specific PDF
- `DELETE /api/pdfs/:id` - Delete PDF
- `GET /api/pdfs/search/:query` - Search PDFs
- `POST /api/pdfs/:id/process` - Process PDF for AI

### Chat
- `GET /api/chat` - Get all chats
- `POST /api/chat` - Create new chat
- `GET /api/chat/:id` - Get specific chat
- `POST /api/chat/:id/messages` - Send message
- `DELETE /api/chat/:id` - Delete chat

### Quiz
- `POST /api/quiz/generate` - Generate quiz from PDFs
- `GET /api/quiz` - Get all quizzes
- `GET /api/quiz/:id` - Get specific quiz
- `POST /api/quiz/:id/submit` - Submit quiz answers
- `GET /api/quiz/:id/results` - Get quiz results
- `DELETE /api/quiz/:id` - Delete quiz

### Progress
- `GET /api/progress/dashboard` - Get dashboard data
- `GET /api/progress/subject/:subject` - Get subject progress
- `GET /api/progress/topic/:topicId` - Get topic progress
- `GET /api/progress/recommendations` - Get learning recommendations
- `GET /api/progress/analytics` - Get progress analytics

## 🏗️ Project Structure

```
study-buddy/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Auth/       # Authentication components
│   │   │   ├── Chat/       # Chat interface
│   │   │   ├── Dashboard/  # Dashboard components
│   │   │   ├── Layout/     # Layout components
│   │   │   ├── PDF/        # PDF management
│   │   │   ├── Progress/   # Progress tracking
│   │   │   └── Quiz/       # Quiz components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── App.js          # Main app component
│   └── package.json
├── server/                 # Express backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── index.js            # Server entry point
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## 🔍 Development Journey

This project was built using modern development practices and tools:

### LLM Tools Used
- **Code Generation**: Used AI assistance for rapid prototyping and component creation
- **API Design**: Leveraged AI for RESTful API structure and database schema design
- **UI/UX**: AI-assisted responsive design and user experience optimization
- **Documentation**: Automated README and code documentation generation

### Key Decisions Made
1. **Pure JavaScript**: Chose React without TypeScript for faster development
2. **Tailwind CSS**: Selected for rapid styling and responsive design
3. **MongoDB**: Chosen for flexible document storage and easy scaling
4. **JWT Authentication**: Implemented for secure user sessions
5. **Modular Architecture**: Separated concerns for maintainability

### Trade-offs
- **Mock LLM Responses**: Implemented basic mock responses due to API limitations
- **Simplified PDF Processing**: Used basic text extraction without advanced NLP
- **Basic Quiz Generation**: Created template-based question generation
- **Limited Real-time Features**: Focused on core functionality over real-time updates

## 🚧 What's Implemented vs Missing

### ✅ Fully Implemented
- User authentication and registration
- PDF upload and management
- Basic chat interface with message history
- Quiz generation and taking system
- Progress tracking and analytics
- Responsive design for all devices
- Complete API backend with all endpoints
- Database models and relationships

### 🔄 Partially Implemented
- RAG system (basic text matching, needs LLM integration)
- Quiz generation (template-based, needs AI enhancement)
- Progress analytics (basic calculations, needs advanced metrics)

### ❌ Not Implemented (Future Enhancements)
- Real-time collaborative features
- Advanced PDF processing with OCR
- Video recommendations integration
- Social features and sharing
- Advanced analytics and machine learning insights
- Mobile app development

## 🐛 Known Issues & Limitations

1. **PDF Processing**: Limited to basic text extraction
2. **AI Responses**: Currently using mock responses
3. **File Storage**: Local storage only (not production-ready)
4. **Error Handling**: Basic error handling implemented
5. **Testing**: No automated tests implemented

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
# Build frontend
npm run build

# Start production server
cd server && npm start
```

### Environment Setup for Production
1. Set `NODE_ENV=production` in environment variables
2. Use production MongoDB instance
3. Configure proper file storage (AWS S3, etc.)
4. Set up proper logging and monitoring
5. Configure reverse proxy (nginx)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Future Roadmap

- [ ] Advanced AI integration with OpenAI GPT models
- [ ] Real-time collaboration features
- [ ] Mobile app development
- [ ] Advanced analytics and insights
- [ ] Social learning features
- [ ] Integration with educational platforms
- [ ] Multi-language support
- [ ] Offline functionality

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Built with ❤️ for students worldwide**

*This project demonstrates modern full-stack development practices using AI-assisted development tools to create a comprehensive learning platform.*
