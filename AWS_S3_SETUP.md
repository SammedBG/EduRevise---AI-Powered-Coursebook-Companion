# AWS S3 Setup Guide for Study Buddy

## 🚀 Quick Setup

### 1. **Create AWS Account**
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Sign up for free account (12 months free tier)
3. Verify your account and payment method

### 2. **Create S3 Bucket**

#### **Via AWS Console:**
1. **Login to AWS Console**: [console.aws.amazon.com](https://console.aws.amazon.com)
2. **Go to S3 Service**: Search "S3" in services
3. **Create Bucket**:
   - **Bucket Name**: `study-buddy-pdfs` (must be globally unique)
   - **Region**: `US East (N. Virginia) us-east-1`
   - **Block Public Access**: Keep enabled (for security)
   - **Bucket Versioning**: Disabled
   - **Default Encryption**: Enabled (SSE-S3)
4. **Create Bucket**

#### **Via AWS CLI:**
```bash
# Install AWS CLI first
aws s3 mb s3://study-buddy-pdfs --region us-east-1
```

### 3. **Create IAM User for Application**

#### **Via AWS Console:**
1. **Go to IAM Service**: Search "IAM" in services
2. **Create User**:
   - **User Name**: `study-buddy-app`
   - **Access Type**: Programmatic access
3. **Attach Policy**: Create custom policy:

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
            "Resource": "arn:aws:s3:::study-buddy-pdfs/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::study-buddy-pdfs"
        }
    ]
}
```

4. **Create User** and save credentials

### 4. **Configure Environment Variables**

#### **Local Development:**
```bash
# Copy template
cp server/env.template server/.env

# Edit with your values
AWS_ACCESS_KEY_ID=AKIA...your-access-key
AWS_SECRET_ACCESS_KEY=...your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=study-buddy-pdfs
```

#### **Production (Render.com):**
In Render dashboard → Environment Variables:
```bash
AWS_ACCESS_KEY_ID=AKIA...your-access-key
AWS_SECRET_ACCESS_KEY=...your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=study-buddy-pdfs
```

#### **Production (Vercel):**
In Vercel dashboard → Settings → Environment Variables:
```bash
AWS_ACCESS_KEY_ID=AKIA...your-access-key
AWS_SECRET_ACCESS_KEY=...your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=study-buddy-pdfs
```

## 🔒 Security Best Practices

### **Bucket Policy (Recommended)**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowAppAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR-ACCOUNT-ID:user/study-buddy-app"
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::study-buddy-pdfs/*"
        },
        {
            "Sid": "AllowAppListBucket",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR-ACCOUNT-ID:user/study-buddy-app"
            },
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::study-buddy-pdfs"
        }
    ]
}
```

### **CORS Configuration**
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

## 💰 Cost Estimation

### **AWS S3 Free Tier (12 months)**
- **Storage**: 5 GB
- **Requests**: 20,000 GET, 2,000 PUT
- **Data Transfer**: 15 GB out per month

### **Typical Usage (100 users)**
- **Storage**: ~1-2 GB/month
- **Requests**: ~10,000/month
- **Cost**: $0-5/month (well within free tier)

### **Paid Pricing (after free tier)**
- **Storage**: $0.023 per GB per month
- **Requests**: $0.0004 per 1,000 requests
- **Data Transfer**: $0.09 per GB

## 🧪 Testing S3 Integration

### **Test Upload:**
```bash
# Test with curl
curl -X POST http://localhost:5000/api/pdfs/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "pdf=@test-file.pdf"
```

### **Check S3 Console:**
1. Go to S3 Console
2. Open your bucket
3. Verify files are uploaded to `pdfs/{userId}/` folders

## 🚨 Troubleshooting

### **Common Issues:**

#### **1. Access Denied Error**
```bash
# Check IAM permissions
aws s3 ls s3://study-buddy-pdfs
```

#### **2. Bucket Not Found**
```bash
# Verify bucket name and region
aws s3 ls --region us-east-1
```

#### **3. CORS Issues**
- Ensure CORS policy is configured
- Check bucket region matches AWS_REGION

#### **4. Environment Variables**
```bash
# Test locally
node -e "console.log(process.env.AWS_ACCESS_KEY_ID)"
```

### **Debug Commands:**
```bash
# List buckets
aws s3 ls

# List bucket contents
aws s3 ls s3://study-buddy-pdfs --recursive

# Test permissions
aws s3 cp test.txt s3://study-buddy-pdfs/test.txt
aws s3 rm s3://study-buddy-pdfs/test.txt
```

## 🔄 Migration from Local Storage

### **Existing PDFs:**
- Old PDFs in `server/uploads/pdfs/` will still work
- New uploads will go to S3
- Database supports both storage types

### **Cleanup:**
```bash
# Remove local uploads directory (after testing)
rm -rf server/uploads/
```

## 📊 Monitoring

### **AWS CloudWatch:**
- Monitor S3 usage and costs
- Set up billing alerts
- Track request patterns

### **Application Logs:**
```bash
# Check upload logs
grep "S3" server/logs/app.log

# Monitor errors
grep "S3.*error" server/logs/error.log
```

## 🎯 Next Steps

1. **Create S3 Bucket** ✅
2. **Set up IAM User** ✅
3. **Configure Environment Variables** ✅
4. **Test Upload Functionality** 
5. **Deploy to Production**
6. **Monitor Usage and Costs**

---

**🎉 Your Study Buddy app now has reliable cloud storage for PDFs!**

*PDFs will be stored securely in AWS S3 and accessible from any deployment platform.*
