# YouTube Videos Recommender Setup Guide

The Study Buddy app now includes a YouTube Videos Recommender feature that suggests educational videos based on your uploaded PDF content.

## Features

- **Smart Content Analysis**: Extracts keywords from PDF content to find relevant educational videos
- **Educational Focus**: Prioritizes tutorial, lesson, and educational content
- **Multiple PDF Support**: Get recommendations for single PDFs or batch recommendations for multiple PDFs
- **Rich Video Information**: Shows video duration, view count, like count, and publishing date
- **Direct Integration**: Access recommendations directly from the PDF Manager

## Setup Instructions

### 1. Get YouTube Data API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Go to "Credentials" and create an API key
5. Optionally, restrict the API key to your domain for security

### 2. Configure Environment Variables

Add the following to your `.env` file in the server directory:

```bash
# YouTube Data API
YOUTUBE_API_KEY=your-youtube-data-api-key-here
```

### 3. API Usage Limits

- **Free Tier**: 10,000 quota units per day
- **Search Request**: Costs 100 quota units
- **Video Details Request**: Costs 1 quota unit

### 4. How It Works

#### Keyword Extraction
The system analyzes your PDF content to extract meaningful keywords:
- Removes common stop words
- Focuses on educational and subject-specific terms
- Prioritizes frequently occurring terms
- Falls back to filename analysis if content extraction fails

#### Video Search
- Searches for videos using extracted keywords + "tutorial lesson education"
- Filters for educational content (category ID 27)
- Prioritizes medium-length videos (4-20 minutes)
- Ensures videos are embeddable and high definition

#### Relevance Scoring
Videos are scored based on:
- Keyword matches in title (highest weight)
- Keyword matches in description (medium weight)
- Educational channel indicators (bonus points)
- Educational keywords like "tutorial", "lesson", "course" (bonus points)

## API Endpoints

### Get Recommendations for Single PDF
```
GET /api/youtube/recommendations/:pdfId
```

**Parameters:**
- `pdfId` (required): MongoDB ObjectId of the PDF
- `maxResults` (optional): Number of videos to return (1-50, default: 10)
- `category` (optional): Video category filter (default: 'educational')

### Get Batch Recommendations for Multiple PDFs
```
POST /api/youtube/recommendations/batch
```

**Body:**
```json
{
  "pdfIds": ["pdfId1", "pdfId2"],
  "maxResults": 10,
  "category": "educational"
}
```

### Get Video Details
```
GET /api/youtube/video/:videoId
```

## Usage Examples

### Frontend Integration
The YouTube recommendations are automatically integrated into the PDF Manager:

1. Upload a PDF
2. Click "Educational Videos" button on any PDF card
3. View recommended videos in a modal
4. Click "Watch" to open videos in YouTube
5. Adjust the number of recommendations (5-20 videos)

### API Usage
```javascript
// Get recommendations for a PDF
const recommendations = await youtubeAPI.getRecommendations(pdfId, {
  maxResults: 10,
  category: 'educational'
});

// Get batch recommendations
const batchRecommendations = await youtubeAPI.getBatchRecommendations({
  pdfIds: [pdfId1, pdfId2],
  maxResults: 15
});
```

## Error Handling

The system includes comprehensive error handling:

- **API Not Configured**: Clear message when YouTube API key is missing
- **PDF Not Found**: Handles invalid or inaccessible PDFs
- **Quota Exceeded**: Graceful handling of API quota limits
- **No Keywords**: Fallback when PDF content analysis fails
- **Network Errors**: Timeout and retry logic

## Customization

### Adjust Search Parameters
Modify the search query in `server/routes/youtube.js`:

```javascript
// Current search query
q: `${searchQuery} tutorial lesson education`

// Customize for specific subjects
q: `${searchQuery} physics tutorial experiment`
q: `${searchQuery} math algebra calculus`
```

### Modify Relevance Scoring
Adjust the scoring algorithm in the `calculateRelevanceScore` function:

```javascript
// Increase weight for title matches
if (title.includes(lowerKeyword)) {
  score += 5; // Increased from 3
}

// Add subject-specific bonuses
const physicsKeywords = ['force', 'energy', 'motion'];
if (physicsKeywords.some(kw => title.includes(kw))) {
  score += 2;
}
```

## Troubleshooting

### Common Issues

1. **"YouTube API not configured"**
   - Ensure `YOUTUBE_API_KEY` is set in your `.env` file
   - Restart the server after adding the environment variable

2. **"API quota exceeded"**
   - Wait for quota reset (daily at midnight Pacific Time)
   - Consider implementing caching for repeated requests
   - Reduce `maxResults` parameter

3. **"No videos found"**
   - Check if PDF has extractable text content
   - Try uploading a PDF with more specific educational content
   - Verify internet connection

4. **"No keywords extracted"**
   - PDF might be image-based (scanned)
   - Try uploading a PDF with selectable text
   - Check PDF processing status

### Performance Tips

- Cache recommendations for frequently accessed PDFs
- Implement request debouncing for batch operations
- Use video thumbnails to reduce bandwidth
- Consider implementing pagination for large result sets

## Future Enhancements

Potential improvements for the YouTube recommender:

- **User Preferences**: Learn from user interactions (watched videos, ratings)
- **Subject-Specific Channels**: Maintain curated lists of educational channels
- **Playlist Generation**: Create custom playlists based on PDF topics
- **Offline Support**: Cache recommendations for offline viewing
- **Multi-language Support**: Search for videos in different languages
- **Advanced Filtering**: Filter by video length, upload date, channel type

## Support

For issues or questions about the YouTube integration:

1. Check the server logs for detailed error messages
2. Verify your YouTube API key permissions
3. Test API connectivity using the `/api/health` endpoint
4. Review the YouTube Data API documentation for quota and usage limits
