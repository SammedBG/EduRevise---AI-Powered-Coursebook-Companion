# GROQ API Setup Guide for Study Buddy

[![GROQ](https://img.shields.io/badge/GROQ-API-blue.svg)](https://console.groq.com/)
[![Llama](https://img.shields.io/badge/Llama-3.1%2070B-orange.svg)](https://huggingface.co/meta-llama)

## 🎯 Overview

GROQ is the primary LLM service for Study Buddy, providing fast and reliable AI-powered responses for chat, quiz generation, and content analysis. This guide covers complete setup and configuration.

## ✅ Current Implementation Status

Study Buddy is configured to use **`llama-3.1-70b-versatile`** as the primary model for:
- **Chat Responses**: Intelligent answers based on PDF content
- **Quiz Generation**: Creating MCQs, SAQs, and LAQs
- **Response Refinement**: Multi-step improvement of AI responses
- **Chat Title Generation**: Automatic descriptive chat naming

## 🔧 Complete Setup Instructions

### 1. Create GROQ Account

1. **Visit GROQ Console**: Go to [https://console.groq.com/](https://console.groq.com/)
2. **Sign Up**: Create a free account with email verification
3. **Complete Profile**: Fill in your profile information
4. **Verify Account**: Check your email for verification link

### 2. Generate API Key

1. **Navigate to API Keys**: Go to API Keys section in console
2. **Create New Key**: Click "Create API Key"
3. **Name Your Key**: Use descriptive name like "Study Buddy Production"
4. **Copy Key**: Save the API key securely (it won't be shown again)

### 3. Environment Configuration

Create or update `.env` file in the `server` directory:

```env
# Study Buddy Server Configuration
PORT=5000
MONGODB_URI=mongodb://localhost:27017/study-buddy
JWT_SECRET=your_jwt_secret_here_change_this_in_production
NODE_ENV=development

# GROQ API (Primary LLM) - REQUIRED
GROQ_API_KEY=your_actual_groq_api_key_here

# Fallback LLM APIs (Optional but recommended)
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
HF_API_TOKEN=your_hugging_face_token_here
```

### 4. Restart Services

After adding the GROQ_API_KEY:

```bash
# Stop current server (Ctrl+C)
# Then restart:
cd server
npm run dev

# In another terminal, restart frontend:
cd client
npm start
```

## 🧪 Testing the Integration

### 1. Basic Connectivity Test
```bash
# Test API endpoint
curl -X GET http://localhost:5000/api/health
```

### 2. Chat Feature Test
1. Go to `http://localhost:3000`
2. Login or register a new account
3. Upload a PDF document
4. Navigate to Chat section
5. Send a message - should use GROQ for responses

### 3. Quiz Generation Test
1. Go to Quiz section
2. Select uploaded PDFs
3. Generate quiz - should use GROQ for question creation
4. Verify questions are contextually relevant

## 🎯 Implementation Details

### LLM Priority Order
```
1. GROQ (llama-3.1-70b-versatile) - Primary
2. Hugging Face (DialoGPT-large) - Fallback
3. Google Gemini (Gemini Pro) - Fallback
4. OpenAI (GPT-4o-mini) - Premium Fallback
5. Mock Responses - Final Fallback
```

### GROQ API Endpoints Used
- **Chat Completions**: `https://api.groq.com/openai/v1/chat/completions`
- **Model**: `llama-3.1-70b-versatile`
- **Max Tokens**: 800 (configurable)
- **Temperature**: 0.2 (for consistent responses)

### Response Processing
```javascript
// Example GROQ API call structure
const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
  model: 'llama-3.1-70b-versatile',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ],
  max_tokens: 800,
  temperature: 0.2
});
```

## 📊 GROQ Benefits & Specifications

### Performance Advantages
- **Speed**: 10-50x faster than traditional cloud APIs
- **Latency**: Sub-second response times
- **Throughput**: High concurrent request handling
- **Reliability**: 99.9% uptime SLA

### Model Specifications
- **Architecture**: Llama 3.1 70B Parameters
- **Context Window**: 128K tokens
- **Training Data**: Up to April 2024
- **Languages**: Multi-language support
- **Capabilities**: Reasoning, coding, analysis, creative writing

### Free Tier Limits
- **Requests**: 30 requests per minute
- **Tokens**: 14,400 input tokens per minute
- **Monthly**: Generous free tier with rollover
- **Rate Limits**: Reasonable for development and testing

## 🔧 Configuration Options

### Advanced Settings

You can customize GROQ behavior by modifying these parameters in the code:

```javascript
// Chat response settings
const chatSettings = {
  model: 'llama-3.1-70b-versatile',
  max_tokens: 800,
  temperature: 0.2,
  top_p: 0.9,
  stream: false
};

// Quiz generation settings
const quizSettings = {
  model: 'llama-3.1-70b-versatile',
  max_tokens: 1200,
  temperature: 0.3,
  top_p: 0.95
};
```

### Error Handling
```javascript
// Automatic fallback chain
try {
  // Try GROQ first
  response = await groqAPI.generateResponse(prompt);
} catch (groqError) {
  console.log('GROQ failed, trying fallback...');
  // Fallback to other APIs
  response = await fallbackAPI.generateResponse(prompt);
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "GROQ API Key Not Found"
```bash
# Check environment variable
echo $GROQ_API_KEY

# Verify .env file location
ls -la server/.env

# Restart server after adding key
npm run dev
```

#### 2. "Rate Limit Exceeded"
- **Solution**: Wait 1 minute and retry
- **Prevention**: Implement request queuing
- **Upgrade**: Consider paid tier for higher limits

#### 3. "Invalid API Key"
- **Check**: Key format and validity
- **Regenerate**: Create new API key in console
- **Verify**: Key permissions and restrictions

#### 4. "Model Not Available"
- **Status**: Check GROQ service status
- **Alternative**: System automatically falls back to other APIs
- **Update**: Ensure using correct model name

### Debug Mode

Enable detailed logging:
```javascript
// Add to server configuration
process.env.DEBUG_GROQ = 'true';

// This will log:
// - API request details
// - Response times
// - Token usage
// - Error details
```

## 📈 Monitoring & Analytics

### Usage Tracking
- **Request Count**: Monitor API calls per day
- **Token Usage**: Track input/output tokens
- **Response Times**: Measure performance metrics
- **Error Rates**: Monitor failure rates

### Optimization Tips
1. **Cache Responses**: Store frequent responses
2. **Batch Requests**: Combine multiple requests
3. **Optimize Prompts**: Reduce token usage
4. **Monitor Limits**: Track quota usage

## 🔒 Security Best Practices

### API Key Protection
```bash
# Never commit API keys to version control
echo ".env" >> .gitignore

# Use environment variables in production
export GROQ_API_KEY="your_key_here"

# Rotate keys regularly
# Set up monitoring for unusual usage
```

### Request Security
- **HTTPS Only**: All API calls use HTTPS
- **Input Validation**: Sanitize all user inputs
- **Rate Limiting**: Implement client-side rate limiting
- **Error Handling**: Don't expose sensitive error details

## 🚀 Production Deployment

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
GROQ_API_KEY=production_key_here
# ... other production settings
```

### Scaling Considerations
- **Load Balancing**: Distribute requests across multiple instances
- **Caching**: Implement Redis for response caching
- **Monitoring**: Set up alerts for quota limits
- **Backup APIs**: Ensure fallback systems work

## 📚 Additional Resources

### Documentation Links
- [GROQ API Documentation](https://console.groq.com/docs)
- [Llama 3.1 Model Details](https://huggingface.co/meta-llama)
- [OpenAI Compatible API](https://console.groq.com/docs/openai)

### Community Support
- [GROQ Discord](https://discord.gg/groq)
- [GitHub Issues](https://github.com/yourusername/study-buddy/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/groq)

---

**🎉 Your Study Buddy is now powered by GROQ's lightning-fast Llama 3.1 70B model!**

*For technical support or questions, please refer to the troubleshooting section or create an issue on GitHub.*
