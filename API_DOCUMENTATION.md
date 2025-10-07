# Study Buddy - Complete API Documentation

[![API](https://img.shields.io/badge/API-v1.0-blue.svg)](https://studybuddy.com/api)
[![Status](https://img.shields.io/badge/Status-Production-green.svg)](https://studybuddy.com)
[![Authentication](https://img.shields.io/badge/Auth-JWT-orange.svg)](https://jwt.io/)

## 🎯 Overview

Study Buddy provides a comprehensive REST API for building AI-powered learning applications. The API supports PDF management, intelligent chat, quiz generation, progress tracking, and YouTube video recommendations.

## 🔗 Base URL

```
Development: http://localhost:5000/api
Production: https://api.studybuddy.com/api
```

## 🔐 Authentication

All API endpoints (except health check and authentication) require JWT authentication.

### Headers
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### Getting a Token
```bash
# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

## 📚 API Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "name": "John Doe",
  "subjects": ["Physics", "Mathematics"]
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe",
    "subjects": ["Physics", "Mathematics"]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Codes:**
- `400` - Validation error (invalid email, weak password)
- `409` - User already exists
- `500` - Server error

#### POST /auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET /auth/profile
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe",
    "subjects": ["Physics", "Mathematics"],
    "createdAt": "2023-07-20T10:00:00.000Z"
  }
}
```

#### PUT /auth/profile
Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "subjects": ["Physics", "Mathematics", "Chemistry"]
}
```

### PDF Management Endpoints

#### POST /pdfs/upload
Upload a PDF file for processing.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:**
```
pdf: <file> (multipart file upload)
```

**Response:**
```json
{
  "message": "PDF uploaded successfully",
  "pdf": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
    "originalName": "physics-textbook.pdf",
    "filename": "pdf-1626789123456-123456789.pdf",
    "size": 5242880,
    "metadata": {
      "title": "Physics Textbook",
      "author": "John Smith",
      "pages": 250,
      "createdAt": "2023-07-20T10:00:00.000Z"
    },
    "uploadDate": "2023-07-20T10:00:00.000Z",
    "content": {
      "processed": false,
      "hasEmbeddings": false
    }
  }
}
```

**Error Codes:**
- `400` - No file uploaded, invalid file type
- `413` - File too large (>10MB)
- `500` - Upload failed

#### GET /pdfs
Get all PDFs for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "pdfs": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "originalName": "physics-textbook.pdf",
      "size": 5242880,
      "metadata": {
        "title": "Physics Textbook",
        "author": "John Smith",
        "pages": 250
      },
      "uploadDate": "2023-07-20T10:00:00.000Z",
      "content": {
        "processed": true,
        "hasEmbeddings": true
      }
    }
  ]
}
```

#### GET /pdfs/:id
Get specific PDF details.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "pdf": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
    "originalName": "physics-textbook.pdf",
    "filename": "pdf-1626789123456-123456789.pdf",
    "size": 5242880,
    "metadata": {
      "title": "Physics Textbook",
      "author": "John Smith",
      "subject": "Physics",
      "pages": 250,
      "createdAt": "2023-07-20T10:00:00.000Z"
    },
    "content": {
      "extractedText": "Physics is the study of matter and energy...",
      "processed": true,
      "chunks": [
        {
          "text": "Physics is the study of matter and energy...",
          "pageNumber": 1,
          "chunkIndex": 0,
          "relevanceScore": 0.85
        }
      ],
      "hasEmbeddings": true,
      "processedAt": "2023-07-20T10:05:00.000Z"
    },
    "uploadDate": "2023-07-20T10:00:00.000Z"
  }
}
```

#### POST /pdfs/:id/process
Process PDF for RAG (chunking and embedding generation).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "PDF processed successfully",
  "chunksCount": 45,
  "processingMethod": "text-extraction",
  "totalTextLength": 125000,
  "averageChunkSize": 2778,
  "hasEmbeddings": true
}
```

**Error Codes:**
- `404` - PDF not found
- `403` - Access denied
- `400` - PDF already processed
- `504` - Processing timeout

#### DELETE /pdfs/:id
Delete a PDF file.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "PDF deleted successfully"
}
```

#### GET /pdfs/search/:query
Search PDFs by content or filename.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "pdfs": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "originalName": "physics-textbook.pdf",
      "metadata": {
        "title": "Physics Textbook",
        "author": "John Smith"
      },
      "uploadDate": "2023-07-20T10:00:00.000Z"
    }
  ]
}
```

### Chat Endpoints

#### GET /chat
Get all chats for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "chats": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
      "title": "Physics Questions",
      "pdfContext": ["60f7b3b3b3b3b3b3b3b3b3b4"],
      "messages": [
        {
          "role": "user",
          "content": "What is Newton's first law?",
          "timestamp": "2023-07-20T10:00:00.000Z"
        },
        {
          "role": "assistant",
          "content": "Newton's first law states that an object at rest will remain at rest...",
          "citations": [
            {
              "pdfId": "60f7b3b3b3b3b3b3b3b3b3b4",
              "pageNumber": 45,
              "snippet": "Newton's first law of motion...",
              "relevanceScore": 0.92
            }
          ],
          "timestamp": "2023-07-20T10:00:05.000Z"
        }
      ],
      "createdAt": "2023-07-20T10:00:00.000Z",
      "updatedAt": "2023-07-20T10:00:05.000Z"
    }
  ]
}
```

#### POST /chat
Create a new chat.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Physics Questions",
  "pdfContext": ["60f7b3b3b3b3b3b3b3b3b3b4"]
}
```

**Response:**
```json
{
  "chat": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
    "title": "Physics Questions",
    "pdfContext": ["60f7b3b3b3b3b3b3b3b3b3b4"],
    "messages": [],
    "createdAt": "2023-07-20T10:00:00.000Z"
  }
}
```

#### GET /chat/:id
Get specific chat details.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "chat": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
    "title": "Physics Questions",
    "pdfContext": ["60f7b3b3b3b3b3b3b3b3b3b4"],
    "messages": [
      {
        "role": "user",
        "content": "What is Newton's first law?",
        "timestamp": "2023-07-20T10:00:00.000Z"
      },
      {
        "role": "assistant",
        "content": "Newton's first law states that an object at rest will remain at rest...",
        "citations": [
          {
            "pdfId": "60f7b3b3b3b3b3b3b3b3b3b4",
            "pageNumber": 45,
            "snippet": "Newton's first law of motion...",
            "relevanceScore": 0.92,
            "sourceLabel": "Source 1 (Page 45)"
          }
        ],
        "timestamp": "2023-07-20T10:00:05.000Z"
      }
    ],
    "createdAt": "2023-07-20T10:00:00.000Z",
    "updatedAt": "2023-07-20T10:00:05.000Z"
  }
}
```

#### POST /chat/:id/messages
Send a message to a chat.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "What is Newton's second law?",
  "pdfContext": ["60f7b3b3b3b3b3b3b3b3b3b4"]
}
```

**Response:**
```json
{
  "message": {
    "role": "assistant",
    "content": "Newton's second law states that the acceleration of an object is directly proportional to the net force acting on it...",
    "citations": [
      {
        "pdfId": "60f7b3b3b3b3b3b3b3b3b3b4",
        "pageNumber": 47,
        "snippet": "Newton's second law of motion...",
        "relevanceScore": 0.89,
        "sourceLabel": "Source 1 (Page 47)"
      }
    ],
    "timestamp": "2023-07-20T10:05:00.000Z"
  }
}
```

**Error Codes:**
- `400` - Missing message content
- `404` - Chat not found
- `403` - Access denied
- `504` - AI service timeout
- `502` - AI generation failed

#### DELETE /chat/:id
Delete a chat.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Chat deleted successfully"
}
```

### Quiz Endpoints

#### POST /quiz/generate
Generate a quiz from selected PDFs.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "pdfIds": ["60f7b3b3b3b3b3b3b3b3b3b4"],
  "difficulty": "mixed",
  "questionTypes": ["mcq", "saq", "laq"],
  "numQuestions": 10
}
```

**Response:**
```json
{
  "quiz": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
    "title": "Quiz from 1 PDF",
    "description": "Generated quiz based on your selected study materials",
    "questions": [
      {
        "question": "What is Newton's first law of motion?",
        "type": "mcq",
        "options": [
          "An object at rest stays at rest",
          "Force equals mass times acceleration",
          "For every action there is an equal and opposite reaction",
          "Energy cannot be created or destroyed"
        ],
        "correctAnswer": 0,
        "explanation": "Newton's first law states that an object at rest will remain at rest...",
        "difficulty": "easy",
        "source": {
          "pdfId": "60f7b3b3b3b3b3b3b3b3b3b4",
          "pageNumber": 45
        }
      }
    ],
    "pdfContext": ["60f7b3b3b3b3b3b3b3b3b3b4"],
    "difficulty": "mixed",
    "timeLimit": 30,
    "createdAt": "2023-07-20T10:00:00.000Z"
  }
}
```

**Error Codes:**
- `400` - Missing PDF IDs, invalid parameters
- `404` - PDFs not found
- `502` - Quiz generation failed
- `504` - Generation timeout

#### GET /quiz
Get all quizzes for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "quizzes": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
      "title": "Quiz from 1 PDF",
      "difficulty": "mixed",
      "createdAt": "2023-07-20T10:00:00.000Z",
      "pdfContext": [
        {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
          "originalName": "physics-textbook.pdf"
        }
      ]
    }
  ]
}
```

#### GET /quiz/:id
Get specific quiz details.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "quiz": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
    "title": "Quiz from 1 PDF",
    "description": "Generated quiz based on your selected study materials",
    "questions": [
      {
        "question": "What is Newton's first law of motion?",
        "type": "mcq",
        "options": [
          "An object at rest stays at rest",
          "Force equals mass times acceleration",
          "For every action there is an equal and opposite reaction",
          "Energy cannot be created or destroyed"
        ],
        "correctAnswer": 0,
        "explanation": "Newton's first law states that an object at rest will remain at rest...",
        "difficulty": "easy",
        "source": {
          "pdfId": "60f7b3b3b3b3b3b3b3b3b3b4",
          "pageNumber": 45
        }
      }
    ],
    "pdfContext": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "originalName": "physics-textbook.pdf"
      }
    ],
    "difficulty": "mixed",
    "timeLimit": 30,
    "attempts": [],
    "createdAt": "2023-07-20T10:00:00.000Z"
  }
}
```

#### POST /quiz/:id/submit
Submit quiz answers and get results.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "answers": [0, 2, 1, 0, 3],
  "timeSpent": 1800
}
```

**Response:**
```json
{
  "results": {
    "totalQuestions": 5,
    "correctAnswers": 4,
    "percentage": 80,
    "earnedPoints": 80,
    "totalPoints": 100,
    "timeSpent": 1800,
    "questionResults": [
      {
        "questionIndex": 0,
        "userAnswer": 0,
        "correctAnswer": 0,
        "isCorrect": true,
        "explanation": "Correct! Newton's first law states..."
      },
      {
        "questionIndex": 1,
        "userAnswer": 2,
        "correctAnswer": 1,
        "isCorrect": false,
        "explanation": "Incorrect. The correct answer is..."
      }
    ]
  }
}
```

#### GET /quiz/:id/results
Get quiz results and attempts.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "attempts": [
    {
      "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "answers": [0, 2, 1, 0, 3],
      "timeSpent": 1800,
      "score": 80,
      "percentage": 80,
      "correctAnswers": 4,
      "totalQuestions": 5,
      "submittedAt": "2023-07-20T10:30:00.000Z",
      "difficulty": "mixed",
      "questionTypes": ["mcq", "mcq", "saq", "mcq", "laq"],
      "questionResults": [
        {
          "questionIndex": 0,
          "userAnswer": 0,
          "correctAnswer": 0,
          "isCorrect": true,
          "explanation": "Correct! Newton's first law states..."
        }
      ]
    }
  ]
}
```

#### POST /quiz/:id/regenerate
Generate new questions for an existing quiz.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "difficulty": "hard",
  "questionTypes": ["mcq", "saq"],
  "numQuestions": 8
}
```

**Response:**
```json
{
  "quiz": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b7",
    "title": "Quiz from 1 PDF (New Set)",
    "description": "New quiz generated from the same study materials",
    "questions": [
      {
        "question": "Explain the relationship between force and acceleration...",
        "type": "saq",
        "correctAnswer": "Force is directly proportional to acceleration...",
        "explanation": "According to Newton's second law...",
        "difficulty": "hard"
      }
    ],
    "difficulty": "hard",
    "timeLimit": 30,
    "createdAt": "2023-07-20T11:00:00.000Z"
  }
}
```

#### DELETE /quiz/:id
Delete a quiz.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Quiz deleted successfully"
}
```

### Progress Tracking Endpoints

#### GET /progress/dashboard
Get user's progress dashboard data.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "overallStats": {
    "totalQuizzes": 15,
    "totalQuestions": 150,
    "correctAnswers": 120,
    "averageScore": 80,
    "currentStreak": 7,
    "subjects": {
      "Physics": {
        "totalQuestions": 75,
        "correctAnswers": 60,
        "topics": 5
      },
      "Mathematics": {
        "totalQuestions": 75,
        "correctAnswers": 60,
        "topics": 3
      }
    },
    "masteryLevels": {
      "beginner": 2,
      "intermediate": 5,
      "advanced": 6,
      "expert": 2
    }
  },
  "recentQuizzes": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
      "title": "Physics Quiz",
      "createdAt": "2023-07-20T10:00:00.000Z",
      "pdfContext": [
        {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
          "originalName": "physics-textbook.pdf"
        }
      ]
    }
  ],
  "weakAreas": [
    {
      "subject": "Physics",
      "topic": "Quantum Mechanics",
      "accuracy": 0.45,
      "totalQuestions": 20
    }
  ],
  "strongAreas": [
    {
      "subject": "Physics",
      "topic": "Newton's Laws",
      "accuracy": 0.95,
      "totalQuestions": 25
    }
  ],
  "detailedProgress": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b8",
      "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "pdfId": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "originalName": "physics-textbook.pdf"
      },
      "subject": "Physics",
      "topic": "Newton's Laws",
      "stats": {
        "totalQuestions": 25,
        "correctAnswers": 24,
        "averageScore": 96,
        "streak": 5,
        "mastery": "expert"
      },
      "updatedAt": "2023-07-20T10:00:00.000Z"
    }
  ]
}
```

#### GET /progress/subject/:subject
Get progress for a specific subject.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "subjectStats": {
    "subject": "Physics",
    "totalTopics": 8,
    "totalQuestions": 125,
    "correctAnswers": 100,
    "averageAccuracy": 80,
    "masteryDistribution": {
      "beginner": 1,
      "intermediate": 3,
      "advanced": 3,
      "expert": 1
    }
  },
  "topics": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b8",
      "subject": "Physics",
      "topic": "Newton's Laws",
      "stats": {
        "totalQuestions": 25,
        "correctAnswers": 24,
        "averageScore": 96,
        "mastery": "expert"
      },
      "updatedAt": "2023-07-20T10:00:00.000Z"
    }
  ]
}
```

#### GET /progress/topic/:topicId
Get progress for a specific topic.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "progress": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b8",
    "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "pdfId": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "originalName": "physics-textbook.pdf"
    },
    "subject": "Physics",
    "topic": "Newton's Laws",
    "stats": {
      "totalQuestions": 25,
      "correctAnswers": 24,
      "averageScore": 96,
      "streak": 5,
      "mastery": "expert"
    },
    "updatedAt": "2023-07-20T10:00:00.000Z"
  },
  "quizAttempts": [
    {
      "id": "60f7b3b3b3b3b3b3b3b3b3b6",
      "title": "Physics Quiz",
      "createdAt": "2023-07-20T10:00:00.000Z",
      "attempts": [
        {
          "score": 96,
          "percentage": 96,
          "timeSpent": 1200,
          "submittedAt": "2023-07-20T10:20:00.000Z"
        }
      ]
    }
  ]
}
```

#### GET /progress/recommendations
Get learning recommendations based on progress.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "recommendations": [
    {
      "type": "weakness",
      "priority": "high",
      "subject": "Physics",
      "topic": "Quantum Mechanics",
      "message": "You're struggling with Quantum Mechanics in Physics. Consider reviewing the material and taking more practice quizzes.",
      "suggestedActions": [
        "Review the PDF content",
        "Take a practice quiz",
        "Ask questions in chat"
      ]
    },
    {
      "type": "strength",
      "priority": "medium",
      "subject": "Physics",
      "topic": "Newton's Laws",
      "message": "Great job with Newton's Laws in Physics! You've mastered this topic well.",
      "suggestedActions": [
        "Help others learn this topic",
        "Move to more advanced topics",
        "Take challenging quizzes"
      ]
    }
  ]
}
```

#### GET /progress/analytics
Get progress analytics for charts and graphs.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period` (optional): `7d`, `30d`, or `90d` (default: `30d`)

**Response:**
```json
{
  "dailyProgress": [
    {
      "date": "2023-07-20",
      "totalQuestions": 10,
      "correctAnswers": 8,
      "subjects": {
        "Physics": {
          "questions": 6,
          "correct": 5
        },
        "Mathematics": {
          "questions": 4,
          "correct": 3
        }
      }
    }
  ],
  "subjectAnalytics": {
    "Physics": {
      "totalQuestions": 75,
      "correctAnswers": 60,
      "topics": 5,
      "averageAccuracy": 80
    },
    "Mathematics": {
      "totalQuestions": 75,
      "correctAnswers": 60,
      "topics": 3,
      "averageAccuracy": 80
    }
  },
  "period": "30d",
  "totalDays": 30
}
```

### YouTube Integration Endpoints

#### GET /youtube/recommendations/:pdfId
Get YouTube video recommendations for a specific PDF.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `maxResults` (optional): Number of videos (1-50, default: 10)
- `category` (optional): Video category (default: 'educational')

**Response:**
```json
{
  "pdfId": "60f7b3b3b3b3b3b3b3b3b3b4",
  "pdfTitle": "physics-textbook.pdf",
  "keywords": ["physics", "newton", "laws", "motion", "force"],
  "recommendations": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "Newton's Laws of Motion - Physics Explained",
      "description": "A comprehensive explanation of Newton's three laws of motion...",
      "channelTitle": "Physics Academy",
      "channelId": "UC123456789",
      "publishedAt": "2023-06-15T08:00:00Z",
      "duration": "PT12M34S",
      "viewCount": "125000",
      "likeCount": "4500",
      "commentCount": "234",
      "thumbnail": {
        "default": "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
        "medium": "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
        "high": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
      },
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "relevanceScore": 0.92
    }
  ],
  "totalResults": 10
}
```

**Error Codes:**
- `400` - Invalid PDF ID
- `404` - PDF not found
- `403` - Access denied
- `503` - YouTube API not configured
- `502` - Recommendations failed

#### POST /youtube/recommendations/batch
Get YouTube recommendations for multiple PDFs.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "pdfIds": ["60f7b3b3b3b3b3b3b3b3b3b4", "60f7b3b3b3b3b3b3b3b3b3b5"],
  "maxResults": 15,
  "category": "educational"
}
```

**Response:**
```json
{
  "pdfIds": ["60f7b3b3b3b3b3b3b3b3b3b4", "60f7b3b3b3b3b3b3b3b3b3b5"],
  "pdfTitles": ["physics-textbook.pdf", "mathematics-guide.pdf"],
  "keywords": ["physics", "mathematics", "newton", "calculus", "algebra"],
  "recommendations": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "Physics and Math Combined - Advanced Topics",
      "description": "Exploring the mathematical foundations of physics...",
      "channelTitle": "Science Channel",
      "relevanceScore": 0.89
    }
  ],
  "totalResults": 15
}
```

#### GET /youtube/video/:videoId
Get detailed information about a specific YouTube video.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Newton's Laws of Motion - Physics Explained",
  "description": "A comprehensive explanation of Newton's three laws of motion...",
  "channelTitle": "Physics Academy",
  "channelId": "UC123456789",
  "publishedAt": "2023-06-15T08:00:00Z",
  "duration": "PT12M34S",
  "viewCount": "125000",
  "likeCount": "4500",
  "commentCount": "234",
  "thumbnail": {
    "default": "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
    "medium": "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    "high": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    "standard": "https://i.ytimg.com/vi/dQw4w9WgXcQ/sddefault.jpg",
    "maxres": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
  },
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ"
}
```

### Health Check

#### GET /health
Check API health status.

**Response:**
```json
{
  "status": "OK",
  "message": "Study Buddy API is running",
  "timestamp": "2023-07-20T10:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

## 🔒 Error Handling

### Standard Error Response Format
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": "Additional error details (optional)"
}
```

### Common Error Codes

#### Authentication Errors
- `INVALID_CREDENTIALS` - Wrong email/password
- `TOKEN_EXPIRED` - JWT token has expired
- `INVALID_TOKEN` - Malformed JWT token
- `MISSING_TOKEN` - No authorization header provided

#### Validation Errors
- `VALIDATION_ERROR` - Request body validation failed
- `MISSING_FIELDS` - Required fields missing
- `INVALID_EMAIL` - Email format invalid
- `WEAK_PASSWORD` - Password doesn't meet requirements

#### Resource Errors
- `PDF_NOT_FOUND` - PDF doesn't exist or access denied
- `CHAT_NOT_FOUND` - Chat doesn't exist or access denied
- `QUIZ_NOT_FOUND` - Quiz doesn't exist or access denied
- `USER_NOT_FOUND` - User account not found

#### API Errors
- `LLM_TIMEOUT` - AI service response timeout
- `LLM_GENERATION_FAILED` - AI response generation failed
- `YOUTUBE_API_NOT_CONFIGURED` - YouTube API key missing
- `YOUTUBE_API_QUOTA_EXCEEDED` - YouTube API quota exceeded

#### Server Errors
- `INTERNAL_SERVER_ERROR` - Unexpected server error
- `SERVICE_UNAVAILABLE` - External service unavailable
- `FILE_UPLOAD_FAILED` - File upload processing failed
- `DATABASE_ERROR` - Database operation failed

## 📊 Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Headers**: Rate limit information included in response headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1626789600
```

## 🔄 Webhooks (Future)

Webhook support is planned for future releases:

- **Quiz Completion**: Notify when user completes quiz
- **Progress Milestones**: Notify when user reaches learning milestones
- **PDF Processing**: Notify when PDF processing completes

## 📱 SDKs and Libraries

### JavaScript/Node.js
```javascript
import { StudyBuddyAPI } from '@studybuddy/api-client';

const api = new StudyBuddyAPI({
  baseURL: 'https://api.studybuddy.com/api',
  token: 'your-jwt-token'
});

// Get user's PDFs
const pdfs = await api.pdfs.getAll();

// Send chat message
const response = await api.chat.sendMessage(chatId, {
  content: "What is Newton's first law?",
  pdfContext: ["pdf-id-1"]
});
```

### Python
```python
from studybuddy import StudyBuddyClient

client = StudyBuddyClient(
    base_url='https://api.studybuddy.com/api',
    token='your-jwt-token'
)

# Generate quiz
quiz = client.quiz.generate({
    'pdfIds': ['pdf-id-1'],
    'numQuestions': 10,
    'difficulty': 'mixed'
})
```

## 🧪 Testing

### Postman Collection
Import the Study Buddy API collection for easy testing:
[Download Postman Collection](https://api.studybuddy.com/postman/collection.json)

### cURL Examples
```bash
# Login
curl -X POST https://api.studybuddy.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Get PDFs
curl -X GET https://api.studybuddy.com/api/pdfs \
  -H "Authorization: Bearer your-jwt-token"

# Send chat message
curl -X POST https://api.studybuddy.com/api/chat/chat-id/messages \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"content": "What is physics?", "pdfContext": ["pdf-id"]}'
```

## 📈 Analytics and Monitoring

### Metrics Tracked
- API response times
- Error rates by endpoint
- User engagement metrics
- PDF processing statistics
- AI service usage

### Monitoring Endpoints
- Health check: `GET /health`
- Metrics: `GET /metrics` (future)
- Status: `GET /status` (future)

## 🔮 Future API Features

### Planned Endpoints
- **Collaboration**: Multi-user study groups
- **Advanced Analytics**: Detailed learning insights
- **Export**: Data export in various formats
- **Integrations**: Third-party platform connections
- **Real-time**: WebSocket support for live updates

### Versioning
- Current: v1.0
- Future: v1.1, v2.0
- Backward compatibility maintained for 12 months

---

**📚 Study Buddy API - Empowering Learning Through Technology**

*For support and questions, please refer to the troubleshooting section or contact our support team.*
