# 🔑 API Keys Setup Guide - Study Buddy

Complete guide to obtaining all API keys needed for Study Buddy.

---

## 📋 Required vs Optional APIs

### **Required APIs** (Must Have)
- ✅ **GROQ API** - Primary LLM for chat and quiz
- ✅ **Google Gemini API** - Embeddings for semantic search
- ✅ **MongoDB Atlas** - Database (covered in DEPLOYMENT.md)
- ✅ **AWS S3** - File storage (covered in DEPLOYMENT.md)

### **Optional APIs** (Nice to Have)
- ⭐ **OpenAI API** - Premium fallback for chat
- ⭐ **Hugging Face** - Alternative LLM
- ⭐ **YouTube Data API** - Video recommendations

---

## 1. GROQ API Setup (Required)

### **Why GROQ?**
- **Speed**: 300-500 tokens/second (fastest available)
- **Cost**: Free tier is very generous
- **Quality**: Llama 3.3 70B rivals GPT-4
- **Model**: `llama-3.3-70b-versatile`

### **Setup Steps**

#### **Step 1: Create Account**
1. **Visit**: [console.groq.com](https://console.groq.com)
2. **Sign in**: Use Google, GitHub, or email
3. **Verify**: Email verification if required

#### **Step 2: Create API Key**
1. **Dashboard** → **API Keys** (left sidebar)
2. **Create API Key** button
3. **Name**: `Study Buddy Production`
4. **Create**

#### **Step 3: Copy and Save**
```
API Key: gsk_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**⚠️ Important**: Save this immediately! You won't see it again.

#### **Step 4: Add to Environment**

**Local (.env)**:
```bash
GROQ_API_KEY=gsk_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Production (Render/Vercel)**:
Add as environment variable in dashboard.

### **Free Tier Limits**
- **Requests**: 14,400 per day
- **Tokens**: 7,000,000 per day
- **Rate Limit**: 30 requests per minute
- **Models**: Access to all models

**Sufficient for**: 100+ students using the app daily

### **Test Your API Key**

```bash
curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Expected**: JSON response with AI-generated message

---

## 2. Google Gemini API Setup (Required)

### **Why Gemini?**
- **Free**: Very generous free tier
- **Quality**: Excellent embeddings
- **Speed**: Fast processing
- **Model**: `text-embedding-004` for embeddings, `gemini-1.5-flash` for chat

### **Setup Steps**

#### **Step 1: Access Google AI Studio**
1. **Visit**: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. **Sign in**: Use Google account
3. **Accept**: Terms of service

#### **Step 2: Create API Key**
1. **Get API key** button
2. **Create API key in new project** (or select existing)
3. **Project name**: "Study Buddy" (if creating new)

#### **Step 3: Copy API Key**
```
API Key: AIzaSyAbc123Def456Ghi789Jkl012Mno345Pqr678Stu
```

**⚠️ Save this**: You can always retrieve it later, but save now.

#### **Step 4: Add to Environment**

**Local (.env)**:
```bash
GEMINI_API_KEY=AIzaSyAbc123Def456Ghi789Jkl012Mno345Pqr678Stu
```

**Production**: Add to Render/Vercel environment variables.

### **Free Tier Limits**
- **Requests**: 60 per minute
- **Daily Limit**: Very high (not usually hit)
- **Models**: gemini-1.5-flash, gemini-1.5-pro, text-embedding-004

**Sufficient for**: Hundreds of users

### **Test Your API Key**

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts":[{"text": "Hello!"}]}]
  }'
```

**Expected**: JSON response with AI-generated content

---

## 3. OpenAI API Setup (Optional)

### **Why OpenAI?**
- **Quality**: Industry-leading responses
- **Reliability**: Most stable API
- **Models**: GPT-4, GPT-3.5-turbo

**Note**: Paid service, requires credit card

### **Setup Steps**

#### **Step 1: Create Account**
1. **Visit**: [platform.openai.com/signup](https://platform.openai.com/signup)
2. **Sign up**: Email or Google/Microsoft account
3. **Verify**: Email and phone number
4. **Add payment**: Credit/debit card required

#### **Step 2: Add Credits**
1. **Settings** → **Billing**
2. **Add payment method**
3. **Add credits**: Minimum $5

#### **Step 3: Create API Key**
1. **API Keys** → **Create new secret key**
2. **Name**: "Study Buddy"
3. **Permissions**: Full access
4. **Create**

#### **Step 4: Copy API Key**
```
API Key: sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234
```

**⚠️ Critical**: Save immediately! Cannot retrieve later.

#### **Step 5: Add to Environment**

```bash
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234
```

### **Pricing**
- **GPT-4o-mini**: $0.150 per 1M input tokens, $0.600 per 1M output
- **GPT-3.5-turbo**: $0.50 per 1M input tokens, $1.50 per 1M output
- **Embeddings**: $0.02 per 1M tokens

**Estimated**: $10-50/month for moderate usage (100 users)

---

## 4. Hugging Face API (Optional)

### **Why Hugging Face?**
- **Free**: Inference API available
- **Models**: Thousands of open-source models
- **Alternative**: Good fallback option

### **Setup Steps**

#### **Step 1: Create Account**
1. **Visit**: [huggingface.co/join](https://huggingface.co/join)
2. **Sign up**: Email or Google/GitHub
3. **Verify**: Email confirmation

#### **Step 2: Create Access Token**
1. **Settings** → **Access Tokens**
2. **New token**
3. **Name**: "Study Buddy"
4. **Role**: Read
5. **Create**

#### **Step 3: Copy Token**
```
Token: hf_abc123def456ghi789jkl012mno345pqr678stu
```

#### **Step 4: Add to Environment**
```bash
HF_API_TOKEN=hf_abc123def456ghi789jkl012mno345pqr678stu
```

### **Free Tier**
- Rate limited but generally sufficient
- Some models may be slow
- Good for fallback scenarios

---

## 5. YouTube Data API Setup (Optional)

### **Why YouTube API?**
- **Educational Videos**: Recommend relevant content
- **Rich Metadata**: Views, likes, duration
- **Free Tier**: 10,000 quota units/day

### **Setup Steps**

#### **Step 1: Create Google Cloud Project**
1. **Visit**: [console.cloud.google.com](https://console.cloud.google.com)
2. **Sign in**: Google account
3. **Create Project**:
   - Click project dropdown → **New Project**
   - Name: "Study Buddy"
   - Create

#### **Step 2: Enable YouTube Data API v3**
1. **APIs & Services** → **Enable APIs and Services**
2. **Search**: "YouTube Data API v3"
3. **Select**: YouTube Data API v3
4. **Enable**

#### **Step 3: Create Credentials**
1. **Credentials** (left sidebar)
2. **Create Credentials** → **API Key**
3. **API Key created**: Copy it

```
API Key: AIzaSyBbc123Def456Ghi789Jkl012Mno345Pqr678Xyz
```

#### **Step 4: Restrict API Key (Recommended)**

1. **Edit** your API key
2. **Application restrictions**:
   - HTTP referrers
   - Add: `https://your-app.vercel.app/*`
3. **API restrictions**:
   - Restrict key
   - Select: YouTube Data API v3
4. **Save**

#### **Step 5: Add to Environment**

```bash
YOUTUBE_API_KEY=AIzaSyBbc123Def456Ghi789Jkl012Mno345Pqr678Xyz
```

### **Free Tier Limits**
- **Quota**: 10,000 units per day
- **Search**: 100 units per request
- **Video details**: 1 unit per request

**Sufficient for**: ~100 video searches per day

---

## 🧪 Testing All APIs

### **Create Test Script**

Create `server/test-all-apis.js`:

```javascript
require('dotenv').config();

async function testAllAPIs() {
  console.log('🧪 Testing all API connections...\n');
  
  // Test GROQ
  console.log('1. Testing GROQ API...');
  if (process.env.GROQ_API_KEY) {
    console.log('✅ GROQ_API_KEY is set');
  } else {
    console.log('❌ GROQ_API_KEY is missing');
  }
  
  // Test Gemini
  console.log('\n2. Testing Gemini API...');
  if (process.env.GEMINI_API_KEY) {
    console.log('✅ GEMINI_API_KEY is set');
  } else {
    console.log('❌ GEMINI_API_KEY is missing');
  }
  
  // Test MongoDB
  console.log('\n3. Testing MongoDB...');
  if (process.env.MONGODB_URI) {
    console.log('✅ MONGODB_URI is set');
  } else {
    console.log('❌ MONGODB_URI is missing');
  }
  
  // Test AWS S3
  console.log('\n4. Testing AWS S3...');
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('✅ AWS credentials are set');
  } else {
    console.log('❌ AWS credentials are missing');
  }
  
  console.log('\n✅ All required APIs configured!');
}

testAllAPIs();
```

**Run**:
```bash
cd server
node test-all-apis.js
```

---

## 📊 API Usage Summary

### **Primary Use Cases**

| API | Used For | Frequency | Cost Impact |
|-----|----------|-----------|-------------|
| **GROQ** | Chat responses, Quiz generation | High | Free tier sufficient |
| **Gemini** | Embeddings, Semantic search | Medium | Free tier sufficient |
| **MongoDB** | Data storage | Constant | Free tier sufficient |
| **AWS S3** | PDF storage | Per upload | ~$1-2/month |
| **YouTube** | Video recommendations | Low | Free tier sufficient |
| **OpenAI** | Premium fallback | Low | Optional |

### **Request Volume Estimates (100 active users)**

```
Daily:
- GROQ: ~500 chat + 200 quiz = 700 requests
- Gemini: ~100 embedding requests
- MongoDB: ~5,000 queries
- S3: ~50 uploads + 200 downloads
- YouTube: ~30 video searches

Monthly:
- GROQ: ~21,000 requests (well within 14,400/day limit)
- Gemini: ~3,000 requests (well within 60/min limit)
- MongoDB: ~150,000 queries (free tier handles this)
- S3: ~1,500 uploads + 6,000 downloads (within free tier)
- YouTube: ~900 searches (within 10,000/day limit)
```

**All well within free tier limits!**

---

## 🔐 Security Best Practices

### **API Key Security**

1. **Never Commit**: Add `.env` to `.gitignore`
2. **Rotate Regularly**: Change keys every 90 days
3. **Restrict Access**: Use API restrictions where possible
4. **Monitor Usage**: Watch for unusual activity
5. **Separate Keys**: Different keys for dev/prod

### **Environment Variables**

**Development (.env)**:
```bash
GROQ_API_KEY=gsk_dev_key_here
GEMINI_API_KEY=AIza_dev_key_here
```

**Production (Render/Vercel)**:
```bash
GROQ_API_KEY=gsk_prod_key_here
GEMINI_API_KEY=AIza_prod_key_here
```

### **Rate Limit Management**

**Built-in Protection**:
- Backend rate limiting: 100 requests per 15 min per IP
- LLM timeout: 30 seconds max
- Retry logic with exponential backoff
- Graceful fallback to alternative APIs

---

## 🎯 API Troubleshooting

### **GROQ API Issues**

**Error**: `401 Unauthorized`
- **Cause**: Invalid API key
- **Fix**: Regenerate key at console.groq.com

**Error**: `429 Too Many Requests`
- **Cause**: Rate limit exceeded
- **Fix**: Wait 1 minute, or upgrade plan

**Error**: `Timeout`
- **Cause**: Model overloaded
- **Fix**: Retry, or fallback to Gemini

---

### **Gemini API Issues**

**Error**: `Invalid API key`
- **Cause**: Wrong key format or revoked
- **Fix**: Create new key at AI Studio

**Error**: `Resource exhausted`
- **Cause**: Exceeded quota (60 req/min)
- **Fix**: Implement request queuing or upgrade

**Error**: `Model not found`
- **Cause**: Model name typo
- **Fix**: Use `gemini-1.5-flash` or `text-embedding-004`

---

### **MongoDB Atlas Issues**

**Error**: `Authentication failed`
- **Cause**: Wrong password in connection string
- **Fix**: Check password, no special characters unencoded

**Error**: `Network timeout`
- **Cause**: IP not whitelisted
- **Fix**: Add `0.0.0.0/0` to Network Access

---

### **AWS S3 Issues**

**Error**: `Access Denied`
- **Cause**: IAM permissions insufficient
- **Fix**: Review IAM policy, ensure PutObject, GetObject, DeleteObject

**Error**: `Bucket not found`
- **Cause**: Bucket name wrong or wrong region
- **Fix**: Verify bucket name and AWS_REGION match

---

## 📊 Monitoring API Usage

### **GROQ Console**
1. **Visit**: [console.groq.com](https://console.groq.com)
2. **Usage**: View request counts
3. **Logs**: See API calls

### **Google Cloud Console**
1. **Visit**: [console.cloud.google.com](https://console.cloud.google.com)
2. **APIs & Services** → **Dashboard**
3. **Quotas**: Monitor usage
4. **Credentials**: Manage keys

### **MongoDB Atlas**
1. **Clusters** → **Metrics**
2. **Monitor**: Connections, operations, storage
3. **Alerts**: Set up usage alerts

### **AWS CloudWatch**
1. **S3** → **Metrics**
2. **Monitor**: Storage, requests
3. **Billing**: Set up budget alerts

---

## 💡 Cost Optimization Tips

### **Reduce LLM Costs**
1. **Cache responses**: Store common Q&A
2. **Limit context**: Send only relevant chunks (not full PDF)
3. **Use cheaper models**: Prefer GROQ over OpenAI
4. **Implement timeouts**: Prevent runaway requests

### **Reduce S3 Costs**
1. **Compress PDFs**: Before upload
2. **Lifecycle policies**: Delete old files
3. **Use S3 Intelligent-Tiering**: For infrequent access

### **Reduce Database Costs**
1. **Index queries**: Faster, cheaper queries
2. **Limit results**: Pagination
3. **Clean old data**: Archive quiz attempts after 6 months

---

## 🎯 API Key Checklist

Before deploying, verify:

### **Local Development**
- [ ] All API keys in `server/.env`
- [ ] `.env` in `.gitignore`
- [ ] Keys working (run test script)

### **Production Deployment**
- [ ] GROQ_API_KEY in Render
- [ ] GEMINI_API_KEY in Render
- [ ] AWS credentials in Render
- [ ] MongoDB URI in Render
- [ ] JWT_SECRET in Render
- [ ] All keys tested and working

### **Optional APIs**
- [ ] OPENAI_API_KEY (if using)
- [ ] HF_API_TOKEN (if using)
- [ ] YOUTUBE_API_KEY (if using)

---

## 🔄 API Key Rotation

### **Recommended Schedule**

- **Production keys**: Rotate every 90 days
- **Development keys**: Rotate every 180 days
- **Compromised keys**: Rotate immediately

### **Rotation Process**

1. **Create new key** in API console
2. **Add to environment** (keep old key active)
3. **Deploy** with new key
4. **Test** thoroughly
5. **Remove old key** from environment
6. **Revoke old key** in API console

---

## 📞 Support Resources

### **API Documentation**
- **GROQ**: [console.groq.com/docs](https://console.groq.com/docs)
- **Gemini**: [ai.google.dev/docs](https://ai.google.dev/docs)
- **OpenAI**: [platform.openai.com/docs](https://platform.openai.com/docs)
- **YouTube**: [developers.google.com/youtube](https://developers.google.com/youtube/v3)

### **Community Support**
- **GROQ Discord**: Community help
- **Google AI Forum**: Gemini support
- **OpenAI Forum**: GPT support
- **Stack Overflow**: General API questions

---

**🎉 You're ready to use all APIs in Study Buddy!**

*With these API keys configured, your application will have full AI capabilities.*
