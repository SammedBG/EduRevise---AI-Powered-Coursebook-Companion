# GROQ API Setup Guide

## ✅ Model Updated Successfully!

I've updated both chat and quiz generation to use the **`llama-3.1-70b-versatile`** model as requested.

## 🔧 Setup Instructions

### 1. Get GROQ API Key
1. Go to [https://console.groq.com/](https://console.groq.com/)
2. Sign up for a free account
3. Create an API key
4. Copy the API key

### 2. Configure Environment Variables
Create a `.env` file in the `server` directory with:

```env
# Study Buddy Server Configuration
PORT=5000
MONGODB_URI=mongodb://localhost:27017/study-buddy
JWT_SECRET=your_jwt_secret_here_change_this_in_production
NODE_ENV=development

# GROQ API (Primary LLM)
GROQ_API_KEY=your_actual_groq_api_key_here
```

### 3. Restart the Server
After adding the GROQ_API_KEY:
```bash
cd server
npm run dev
```

## 🧪 Test the Setup

1. Go to `http://localhost:3000`
2. Click the "🧪 Test" tab
3. Use the Auth Debug to login/register
4. Try the chat feature - it will now use `llama-3.1-70b-versatile`
5. Generate a quiz - it will also use `llama-3.1-70b-versatile`

## 🎯 What's Updated

- **Chat API**: Now uses `llama-3.1-70b-versatile` for responses
- **Quiz API**: Now uses `llama-3.1-70b-versatile` for question generation
- **Priority Order**: GROQ → Hugging Face → Gemini → OpenAI → Mock

## 📊 GROQ Benefits

- **Fast**: Very fast response times
- **Free Tier**: Generous free usage limits
- **Quality**: Excellent performance with Llama 3.1 70B
- **Reliable**: Stable API with good uptime

The system will automatically use GROQ as the primary LLM once you add the API key!
